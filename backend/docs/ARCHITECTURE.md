# Backend Architecture

## Overview

The ESI Help Desk backend is a FastAPI-powered REST API designed to deliver intelligent support ticket routing, knowledge base integration, and guardrail enforcement for a cybersecurity training platform.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with pgvector extension
- **Vector Search**: Maximal Marginal Relevance (MMR)
- **LLM Provider**: OpenAI (GPT-4o)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Deployment**: Render (Web Service)

## Architecture Diagram

```
            ┌─────────────────┐
            │   Frontend      │
            │   (Vercel)      │
            └────────┬────────┘
                     │ HTTPS
┌─────────────────────────────────────────┐
│         FastAPI Backend (Render)        │
│  ┌───────────────────────────────────┐  │
│  │      API Layer (app/routes/)      │  │
│  │  - auth.py                        │  │
│  │  - chat.py                        │  │
│  │  - tickets.py                     │  │
│  │  - metrics.py                     │  │
│  └──────────┬────────────────────────┘  │
│             │                           │
│  ┌────────────────────────────────── ┐  │
│  │   Service Layer (app/services/)   │  │
│  │  - chunking.py                    │  │
│  │  - embeddings.py                  │  │
│  │  - guardrails.py                  │  │
│  │  - memory.py                      │  │
│  │  - prompts.py                     │  │
│  │  - rag.py                         │  │
│  │  - tickets.py                     │  │
│  └──────────┬────────────────────────┘  │
│             │                           │
│  ┌──────────▼────────────────────────┐  │
│  │   Database Layer (app/models/)    │  │
│  │  - db.py (SQLAlchemy ORM)         │  │
│  │  - schemas.py (Pydantic)          │  │
│  └──────────┬────────────────────────┘  │
│             │                           │
│  ┌──────────▼────────────────────────┐  │
│  │   PostgreSQL + pgvector Database  │  │
│  │                                   │  │
│  │    embeddings                     │  │
│  │    chat_sessions                  │  │
│  │    chat_messages                  │  │
│  │    kb_references                  │  │
│  │    guardrails                     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │ 
            ┌─────────────────┐
            │   OpenAI API    │
            │  - GPT-4o       │
            │  - Embeddings   │
            └─────────────────┘
```

## Key Components

### API Layer
The API layer handles incoming HTTP requests and routes them to the appropriate services. Key routes include:
- **auth.py**: Handles authentication and user management.
- **chat.py**: Manages chat interactions and integrates with the RAG pipeline.
- **tickets.py**: Handles ticket creation and escalation.
- **metrics.py**: Provides analytics and system metrics.

### Service Layer
The service layer contains the core business logic:
- **chunking.py**: Splits knowledge base documents into smaller chunks for efficient retrieval.
- **embeddings.py**: Generates vector embeddings for knowledge base documents using OpenAI's embedding model.
- **guardrails.py**: Enforces security and role-based restrictions on user queries.
- **memory.py**: Manages chat sessions, message history, and knowledge base references.
- **prompts.py**: Defines prompt templates for the LLM, including role-specific behavior and classification logic.
- **rag.py**: Implements the Retrieval-Augmented Generation (RAG) pipeline, integrating document retrieval, LLM responses, and classification.
- **tickets.py**: Handles ticket creation logic, including escalation triggers.

### Database Layer
The database layer uses PostgreSQL with the pgvector extension for vector search. Key tables include:
- **chat_sessions**: Stores session metadata.
- **chat_messages**: Stores user and assistant messages.
- **kb_references**: Tracks knowledge base documents referenced in responses.
- **guardrails**: Logs guardrail violations and blocked actions.
- **users**: Users created or registered
- **tickets**: created and storing the tables

### Knowledge Base Integration
The knowledge base is stored as Markdown files and processed into vector embeddings. The RAG pipeline retrieves relevant chunks using Maximal Marginal Relevance (MMR) and integrates them into LLM responses.

### Guardrails
Guardrails enforce security policies and role-based restrictions. They block unauthorized actions, such as accessing host infrastructure or performing destructive operations, and escalate issues when necessary.

### Retrieval-Augmented Generation (RAG)
The RAG pipeline retrieves relevant knowledge base documents, formats them, and integrates them into LLM responses. It includes:
- **Document Retrieval**: Uses pgvector for semantic search.
- **LLM Integration**: Generates responses using GPT-4o.
- **Classification**: Analyzes responses for severity, tier, and escalation needs.

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=                # OpenAI API key for GPT-4o and embeddings
CONNECTION_PG_DB=              # PostgreSQL database connection string
CONNECTION_PG_VECTORDB=        # PostgreSQL vector database connection string
CONNECTION_NAME=               # Collection name for pgvector
```

## Deployment

The backend is deployed as a web service on Render, with the following considerations:
- **Scalability**: Supports high-concurrency scenarios with async FastAPI.
- **Security**: Enforces strict guardrails and role-based access control.
- **Integration**: Connects to OpenAI APIs and a PostgreSQL database with pgvector.