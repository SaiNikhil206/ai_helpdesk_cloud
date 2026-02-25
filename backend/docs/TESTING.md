## Manual Testing

### 1. API Testing

- Use tools like **Postman** or **cURL** to manually test API endpoints.
- Verify the following:
  - Authentication and authorization flows.
  - Chat interactions and RAG pipeline responses.
  - Ticket creation and escalation.

### 2. Knowledge Base Testing

- Test the retrieval of KB documents using the RAG pipeline.
- Verify that the correct documents are retrieved based on user queries.

### 3. Guardrails Testing

- Test guardrail enforcement by sending prohibited messages (e.g., "disable logging").
- Verify that the system blocks the action and provides the correct response.


This guide provides a comprehensive overview of the testing strategy for the ESI Help Desk backend. Following these practices will ensure the system is robust, reliable, and secure.