# API Documentation

## Base URL

**Production**: `https://ai-helpdesk-cloud.onrender.com`  
**Local**: `http://localhost:8000`

## Documentation for Backend APIs

Visit `https://ai-helpdesk-cloud.onrender.com/docs` for Swagger UI documentation.

## Authentication

### `POST /api/auth/register`

register a new user

**Response**:
```json
{
  "username": "nikhil",
  "password": "1234",
  "role": "admin"
}
```

### `POST /api/auth/login`

login a user

**Response**:
```json
{
  "username": "nikhil",
  "password": "1234"
}
```

## Endpoints

### Health Check

#### `GET /`

endpoint for health check.

**Response**:
```json
{
  "status": "healthy",
  "service": "ESI Help Desk",
  "version": "1.0.0"
}
```

#### `GET /health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy"
}
```

---

### Chat API

#### `POST /api/chat`

Send a message to the ESI Help Desk and receive a grounded response.

**Request Body**:
```json
{
  "session_id": "string",
  "message": "string",
  "user_role": "trainee" | "instructor" | "operator" | "support_engineer" | "admin",
  "user_id":"string",
  "context": {
    "module": "string (optional)",
    "channel": "string (optional)"
  }
}
```

**Response**:
```json
{
  "answer": "string",
  "kb_references": [
    {
      "id": "string",
      "title": "string"
    }
  ],
  "confidence": 0.85,
  "tier": "TIER_1",
  "severity": "MEDIUM",
  "needs_escalation": false,
  "guardrail": {
    "blocked": false,
    "reason": null
  },
  "ticket_id": null
}
```

**Example**:
```bash
curl -X POST https://ai-helpdesk-cloud.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-123",
    "message": "How do I access the host machine behind my VM?",
    "user_role": "trainee",
    "user_id":"",
    "context": {
      "module": "",
      "channel": ""
    }
  }'
```

**Status Codes**:
- `200 OK`: Success
- `422 Unprocessable Entity`: Invalid request body
- `500 Internal Server Error`: Server error

---

### Tickets API

#### `POST /api/tickets`

Create a new ticket.

**Request Body**:
```json
{
  "session_id": "string",
  "tier": "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "user_role": "trainee" | "instructor" | "operator" | "support_engineer" | "admin",
  "ai_results": {}
}
```

**Response**:
```json
{
  "id": "string",
  "session_id": "string",
  "tier": "TIER_1",
  "severity": "MEDIUM",
  "status": "OPEN",
  "user_role": "trainee",
  "ai_results": {},
  "created_at": "2026-02-20T00:00:00Z"
}
```

**Status Codes**:
- `201 Created`: Ticket created successfully
- `422 Unprocessable Entity`: Invalid request body
- `500 Internal Server Error`: Server error

---

#### `GET /api/tickets`

List all tickets with optional filters.

**Query Parameters**:
- `status` (optional): Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- `tier` (optional): Filter by tier (TIER_0, TIER_1, etc.)
- `severity` (optional): Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)

**Response**:
```json
[
  {
    "id": "string",
    "session_id": "string",
    "tier": "TIER_1",
    "severity": "MEDIUM",
    "status": "OPEN",
    "user_role": "trainee",
    "ai_results": {},
    "created_at": "2026-02-20T00:00:00Z"
  }
]
```

#### `PUT /api/tickets/{ticket_id}`

Update a ticket's status, tier, or severity.

**Request Body**:
```json
{
  "status": "IN_PROGRESS" | "RESOLVED" | "CLOSED",
  "tier": "TIER_0" | "TIER_1" | ,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" 
}
```

**Response**:
```json
{
  "id": "string",
  "status": "IN_PROGRESS"
}
```

**Status Codes**:
- `200 OK`: Success
- `422 Unprocessable Entity`: Invalid request body
- `500 Internal Server Error`: Server error

---

### Metrics API

#### `GET /api/metrics/summary`

Get summary metrics for the help desk.

**Response**:
```json
{
    "totalTickets": "total_tickets",
    "avg_confidence": 0.82,
    "totalConversations": 1,
    "openTickets": "open_tickets",
    "closedTickets": "closed_tickets",
    "ticketsBySeverity": "tickets_by_severity",
    "ticketsByTier": "tickets_by_tier",
    "guardrailActivations": "guardrail_hits",
    "escalations": "escalation_count",
    "conversationVolumes": {
        "sessions": "total_sessions",
        "messages": "total_messages",
    },
    "deflectionRate": "deflection_rate",
}
```

---

#### `GET /api/metrics/trends`

Get trend data for conversations and tickets.

**Query Parameters**:
- `period` (optional, default: 7): Number of days to include

**Response**:
```json
{
    "tickets": 1,
    "guardrails": 12,
    "escalations": 28,
    "conversationVolumes": {
        "sessions": 23,
        "messages": 45,
    },

    "issueCategories": 35
}
```

---

---

## CORS

Allowed origins:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://ai-helpdesk-cloud.vercel.app`

---
