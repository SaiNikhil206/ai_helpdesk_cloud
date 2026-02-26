from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, PydanticOutputParser
from langchain_core.runnables import RunnableLambda
from app.services.tickets import create_ticket_if_needed
from app.services.prompts import PROMPT_TEMPLATE, CLASSIFICATION_PROMPT_TEMPLATE
from app.services.embeddings import vectorstore
from app.models.schemas import ChatRequest, ChatResponse, GuardRail
from sqlalchemy.orm import Session
from app.services.tier_service import TierService
from app.services.guardrails import evaluate_guardrails, validate_kb_grounding
from app.services.memory import get_or_create_session, save_message, load_chat_history, save_guardrail_event, save_kb_references
from app.services.role_policy import apply_role_constraints, adjust_answer_for_role, role_guardrail_message
from dotenv import load_dotenv
load_dotenv()

tier_service = TierService()

retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 3, "lambda_mult": 0.25},
    include_metadata=True
)

parser = PydanticOutputParser(pydantic_object=ChatResponse)
format_instructions = parser.get_format_instructions()

safe_format_instructions = format_instructions.replace("{", "{{").replace("}", "}}")


prompt = ChatPromptTemplate.from_messages([
    ("system",PROMPT_TEMPLATE +
        "\n\nReturn your response in the following JSON format:\n" +
        safe_format_instructions),
    ("user", "Role: {role}\nContext: {context}\n\nQuestion: {message}")
])

def format_docs(docs):
    formatted = []

    for doc in docs:
        source = doc.metadata.get("source", "unknown")
        doc_id = doc.metadata.get("id", source)

        formatted.append(
            f"[ID: {doc_id} | SOURCE: {source}]\n{doc.page_content}"
        )

    return "\n\n".join(formatted)

llm = ChatOpenAI(model="gpt-4o", temperature=0)

rag_chain = {
    "context": RunnableLambda(lambda x: x["message"]) |retriever | format_docs,
    "message": RunnableLambda(lambda x: x["message"]),
    "role": RunnableLambda(lambda x: x["role"]),
} | prompt | llm | parser

classification_parser = PydanticOutputParser(pydantic_object=ChatResponse)
format_instructions_classify = classification_parser.get_format_instructions()

safe_format_instructions = format_instructions_classify.replace("{", "{{").replace("}", "}}")

prompt_classification = ChatPromptTemplate.from_messages([
    ("system", CLASSIFICATION_PROMPT_TEMPLATE+
        "\n\nReturn your response in the following JSON format:\n" +
        safe_format_instructions),
    ("user", "Support Request:{message}\n\nGenerated Answer: {answer}\n\nConversation History: {history}")
])

classify_chain = (
    prompt_classification
    | llm
    | classification_parser
)


def ask_question(request: ChatRequest, db: Session) -> ChatResponse:

    # SESSION 
    session = get_or_create_session(
        db=db,
        session_id=request.session_id,
        user_id=request.user_id,
        user_role=request.user_role,
        context=request.context,
    )

    # SAVE USER MESSAGE 
    user_msg = save_message(
        db=db,
        session_db_id=session.id,
        role="user",
        content=request.message,
    )

    db.flush()

    # GUARDRAILS 
    guardrail_result = evaluate_guardrails(
        message=request.message,
        user_role=request.user_role,
    )

    save_guardrail_event(
        db=db,
        session_id=session.id,
        message_id=user_msg.id,
        blocked=guardrail_result["blocked"],
        reason=guardrail_result.get("reason"),
    )

    # If blocked by guardrails, return response immediately without invoking RAG

    if guardrail_result["blocked"]:

        response = ChatResponse(
            answer=role_guardrail_message(request.user_role),
            confidence=1.0,
            tier="TIER_2" if guardrail_result["needs_escalation"] else "TIER_1",
            severity=guardrail_result["severity"] or "MEDIUM",
            needEscalation=guardrail_result["needs_escalation"],
            guardrail={
                "blocked": True,
                "reason": guardrail_result["reason"],
            },
            kbReferences=[],
        )

        # CREATE TICKET FOR ESCALATED GUARDRail
        ticket = create_ticket_if_needed(
            db=db,
            session=session,
            request=request,
            response=response,
        )

        if ticket:
            response.ticketId = ticket.id

        assistant_msg = save_message(
            db=db,
            session_db_id=session.id,
            role="assistant",
            content=response.answer,
            tier=response.tier,
            severity=response.severity,
            need_escalation=response.needEscalation,
            confidence=response.confidence,
        )

        db.flush()

        save_guardrail_event(
            db=db,
            session_id=session.id,
            message_id=assistant_msg.id,
            blocked=False,
        )

        db.commit()
        return response

    # RETRIEVE DOCS
    retrieved_docs = retriever.invoke(request.message)

    save_kb_references(db, session.id, retrieved_docs)

    if not validate_kb_grounding(retrieved_docs):

        response = ChatResponse(
            answer="This information is not available in the knowledge base. I’ll escalate this to support.",
            confidence=1.0,
            tier="TIER_2",
            severity="MEDIUM",
            needEscalation=True,
            guardrail={
                "blocked": False,
                "reason": "No KB grounding",
            },
            kbReferences=[],
        )

        ticket = create_ticket_if_needed(db, session, request, response)

        if ticket:
            response.ticketId = ticket.id

        assistant_msg = save_message(
            db=db,
            session_db_id=session.id,
            role="assistant",
            content=response.answer,
            tier=response.tier,
            severity=response.severity,
            need_escalation=response.needEscalation,
            confidence=response.confidence,
        )

        db.commit()
        return response

    # RAG ANSWER 
    rag_response: ChatResponse = rag_chain.invoke({
        "message": request.message,
        "role": request.user_role,
    })

    history_text = load_chat_history(db, session.id, limit=10)

    classification: ChatResponse = classify_chain.invoke({
        "message": request.message,
        "answer": rag_response.answer,
        "history": history_text,
    })

    # APPLY CLASSIFICATION
    kb_grounded = True 
    repeated_failure_signal = classification.needEscalation

    tier, severity, needs_escalation = tier_service.classify_tier_and_severity(
        message=request.message,
        user_role=request.user_role,
        context=request.context,
        kb_coverage=kb_grounded,
        repeated_failure=repeated_failure_signal,
        need_escalation=classification.needEscalation,
    )

    rag_response.tier = apply_role_constraints(
        role=request.user_role,
        tier=tier.value,
    )

    rag_response.severity = severity.value
    rag_response.needEscalation = needs_escalation

    rag_response.confidence = min(
        rag_response.confidence or 0.97,
        classification.confidence,
    )

    # ROLE SAFETY OVERRIDES 
    if request.user_role.lower() == "trainee" and rag_response.severity == "CRITICAL":
        rag_response.needEscalation = True
        rag_response.tier = "TIER_2"

    # TICKET CREATION
    ticket = create_ticket_if_needed(
        db=db,
        session=session,
        request=request,
        response=rag_response,
    )

    if ticket:
        rag_response.ticketId = ticket.id

    # ROLE-AWARE ANSWER
    rag_response.answer = adjust_answer_for_role(
        rag_response.answer,
        request.user_role,
    )

    rag_response.guardrail = GuardRail(
        blocked=False,
        reason=None
    )

    # SAVE ASSISTANT MESSAGE
    save_message(
        db=db,
        session_db_id=session.id,
        role="assistant",
        content=rag_response.answer,
        tier=rag_response.tier,
        severity=rag_response.severity,
        need_escalation=rag_response.needEscalation,
        confidence=rag_response.confidence,
    )

    db.commit()
    return rag_response