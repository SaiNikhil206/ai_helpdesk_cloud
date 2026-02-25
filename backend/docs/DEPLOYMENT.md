# Deployment Guide

This document outlines the steps to deploy the ESI Help Desk backend on Render using GitHub integration.

---

## Prerequisites

Before deploying, ensure the following:

1. **Environment Setup**:
   - Python 3.9+ installed locally for testing.
   - PostgreSQL database with the `pgvector` extension enabled.
   - OpenAI API key for GPT-4o and embeddings.

2. **Environment Variables**:
   Set the following environment variables in your Render dashboard:
   ```bash
   OPENAI_API_KEY=                # OpenAI API key for GPT-4o and embeddings
   CONNECTION_PG_DB=              # PostgreSQL database connection string
   CONNECTION_PG_VECTORDB=        # PostgreSQL vector database connection string
   CONNECTION_NAME=               # Collection name for pgvector
   ```

3. **Knowledge Base**:
   Ensure the knowledge base (Markdown files) is located in the `backend/kb` directory.

---

## Deployment Steps

### 1. Push Code to GitHub

1. Commit and push your code to a GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push origin main
   ```

2. Ensure your repository is up-to-date and accessible.

---

### 2. Deploy on Render

1. **Create a New Web Service**:
   - Go to the Render dashboard.
   - Select "New" > "Web Service".
   - Connect your GitHub repository.

2. **Configure Build Settings**:
   - **Environment**: Python 3.9+
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port 8000
     ```

3. **Set Environment Variables**:
   Add the required environment variables in the "Environment" section:
   ```bash
   OPENAI_API_KEY=                # OpenAI API key
   CONNECTION_PG_DB=              # PostgreSQL database connection string
   CONNECTION_PG_VECTORDB=        # PostgreSQL vector database connection string
   CONNECTION_NAME=               # Collection name for pgvector
   ```

4. **Deploy**:
   - Click "Deploy".
   - Monitor the build logs for any errors.

5. **Access the Service**:
   - Once deployed, Render will provide a public URL for your backend.
   - Test the API at `https://ai-helpdesk-cloud.onrender.com/docs`.

---

### 3. Database Configuration

Ensure the following tables are created in your PostgreSQL database:

- **chat_sessions**: Stores session metadata.
- **chat_messages**: Stores user and assistant messages.
- **kb_references**: Tracks knowledge base documents referenced in responses.
- **guardrails**: Logs guardrail violations and blocked actions.
- **users**: Users created or registered
- **tickets**: created and storing the tables

Use the following SQL to create the `pgvector` extension if not already enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 4. Scaling and Performance

- **Concurrency**:
  - FastAPI supports high-concurrency scenarios with its async capabilities.
  - Render automatically scales your service based on traffic.

- **Caching**:
  - Consider adding a caching layer (e.g., Redis) for frequently accessed data.

---

### 5. Monitoring and Logging

- **Monitoring**:
  - Use Render's built-in monitoring tools to track resource usage.

- **Logging**:
  - Ensure logs are written to `stdout` for Render to capture.

---

### 6. Troubleshooting

- **Deployment Fails**:
  - Check the build logs for errors.
  - Ensure all environment variables are correctly set.

- **Database Connection Issues**:
  - Verify the `CONNECTION_PG_DB` and `CONNECTION_PG_VECTORDB` strings.
  - Ensure the `pgvector` extension is enabled.

- **API Errors**:
  - Check the FastAPI logs for detailed error messages.
  - Use the `/docs` endpoint to test individual API routes.

---

### 7. Future Enhancements

- **CI/CD**:
  - Integrate with GitHub Actions for automated testing and deployment.

---

This guide provides the necessary steps to deploy and maintain the ESI Help Desk backend using GitHub and Render. For further assistance, refer to the official documentation of Render, FastAPI, or PostgreSQL.