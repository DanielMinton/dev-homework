# DEV-PART2: Project Status & Deployment Guide

**Author:** Daniel Minton (@TheModernOpossum)
**Repository:** https://github.com/DanielMinton/dev-homework

---

## Current Project Status

### What's Complete

| Component | Status | Notes |
|-----------|--------|-------|
| PostgreSQL Schema | ✅ Ready | `tickets`, `analysis_runs`, `ticket_analysis` tables |
| Backend API | ✅ Ready | Express + TypeScript, all endpoints implemented |
| LangGraph Agent | ✅ Ready | 4-node graph with state management |
| Frontend UI | ✅ Ready | Next.js 14 + shadcn/ui + Framer Motion |
| Docker Compose | ✅ Ready | Multi-service orchestration |
| Documentation | ✅ Ready | Comprehensive README |

### What Needs Testing

| Item | Priority | Action Required |
|------|----------|-----------------|
| Docker end-to-end | HIGH | Run `docker compose up --build` |
| OpenAI integration | HIGH | Verify API key works with LangGraph |
| Frontend-backend connection | MEDIUM | Test API calls from UI |
| Database persistence | MEDIUM | Verify data survives container restarts |

---

## Major Changes Log

### Version 1.0 (Current)

1. **LangChain Package Updates**
   - Upgraded to LangChain v1 stable packages:
     - `@langchain/core`: 1.1.7
     - `@langchain/langgraph`: 1.0.7
     - `@langchain/openai`: 1.2.0
   - Required type assertion workarounds for `withStructuredOutput` due to TypeScript deep instantiation limits

2. **TypeScript Strict Mode Compliance**
   - All unused parameters prefixed with underscore
   - Explicit type annotations throughout
   - Zod schemas for structured output validation

3. **Next.js Build Caveat**
   - Static generation has SSR issue with Radix UI + Next.js 14.2.22
   - **Runtime works perfectly** - this is build-time only
   - Use `npm run dev` or Docker for execution

---

## Code Review & Adjustments

### Files to Monitor

```
backend/src/agent/nodes.ts    # LangGraph node implementations
backend/src/agent/graph.ts    # Graph definition
backend/src/agent/tools.ts    # Analysis runner
backend/src/config/env.ts     # Environment validation (will fail without valid env vars)
```

### Critical Configuration

**backend/src/config/env.ts** - This validates env vars at startup:
```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),  // REQUIRED
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
```

If `OPENAI_API_KEY` is missing or invalid, the backend will crash on startup.

### LangGraph Architecture (with Conditional Edges)

```
┌──────────────────────────────────────────────────────────────────┐
│                    LangGraph Workflow                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  START                                                            │
│    │                                                              │
│    ▼                                                              │
│  ┌─────────────────┐                                             │
│  │  fetchTickets   │  Query PostgreSQL for tickets               │
│  └────────┬────────┘                                             │
│           │                                                       │
│           ▼                                                       │
│     ┌─────────────┐                                              │
│     │shouldAnalyze│  CONDITIONAL: Check if tickets exist         │
│     └──────┬──────┘                                              │
│            │                                                      │
│      ┌─────┴─────┐                                               │
│      │           │                                                │
│      ▼           ▼                                                │
│  [tickets]   [no tickets]                                        │
│      │           │                                                │
│      ▼           ▼                                                │
│  ┌─────────┐  ┌──────────┐                                       │
│  │ analyze │  │ noTickets│  Return "No tickets found"            │
│  │ Tickets │  └────┬─────┘                                       │
│  └────┬────┘       │                                             │
│       │            │                                              │
│       ▼            │                                              │
│  ┌────────────┐    │                                             │
│  │shouldGen   │    │  CONDITIONAL: Skip summary for <2 tickets   │
│  │Summary     │    │                                             │
│  └─────┬──────┘    │                                             │
│        │           │                                              │
│   ┌────┴────┐      │                                             │
│   │         │      │                                              │
│   ▼         ▼      │                                              │
│ [2+]      [<2]     │                                             │
│   │         │      │                                              │
│   ▼         │      │                                              │
│ ┌────────┐  │      │                                             │
│ │generate│  │      │                                             │
│ │Summary │  │      │                                             │
│ └───┬────┘  │      │                                             │
│     │       │      │                                              │
│     └───────┼──────┘                                             │
│             │                                                     │
│             ▼                                                     │
│      ┌─────────────┐                                             │
│      │persistResults│  Write to analysis_runs + ticket_analysis  │
│      └──────┬──────┘                                             │
│             │                                                     │
│             ▼                                                     │
│           END                                                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Conditional Edge Functions

```typescript
// Skip analysis if no tickets
function shouldAnalyze(state): "analyzeTickets" | "noTickets"

// Skip summary generation for single ticket (no need to summarize 1 item)
function shouldGenerateSummary(state): "generateSummary" | "skipSummary"
```

### State Schema

```typescript
AgentState = {
  runId: number,           // Database run ID
  ticketIds: number[],     // Tickets to analyze
  tickets: Ticket[],       // Fetched ticket data
  analyses: Analysis[],    // Per-ticket results
  summary: string,         // Executive summary
  status: "pending" | "analyzing" | "complete" | "error"
}
```

---

## Deployment Directive for Claude Code

### Prerequisites (Manual Steps)

Before running automated deployment, ensure:

1. **Docker Desktop is installed and running**
   ```bash
   docker --version
   docker compose version
   ```

2. **Create local .env file**
   ```bash
   cd /Users/themodernopossum/code/dev-homework
   cp .env.example .env
   ```

3. **Add your OpenAI API key to .env**
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

4. **Verify no secrets in git**
   ```bash
   git status  # .env should be ignored
   ```

### Automated Deployment Steps

Once prerequisites are complete, execute the following sequence:

#### Step 1: Clean Build
```bash
cd /Users/themodernopossum/code/dev-homework
docker compose down -v  # Remove old containers and volumes
docker compose build --no-cache  # Fresh build
```

#### Step 2: Start Services
```bash
docker compose up -d  # Detached mode
```

#### Step 3: Verify Services
```bash
# Check all containers are running
docker compose ps

# Check backend health
curl http://localhost:3001/health

# Check database connection
docker compose exec db psql -U postgres -d tickets -c "SELECT COUNT(*) FROM tickets;"
```

#### Step 4: Test API Endpoints
```bash
# Create test tickets
curl -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"tickets": [
    {"title": "Billing issue", "description": "Cannot access invoices"},
    {"title": "App crashes", "description": "Crashes on file upload over 10MB"}
  ]}'

# Trigger analysis
curl -X POST http://localhost:3001/api/analyze

# Get results (wait a few seconds for analysis to complete)
sleep 5
curl http://localhost:3001/api/analysis/latest
```

#### Step 5: Access Frontend
```
Open: http://localhost:3000
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `docker compose logs backend` - likely missing OPENAI_API_KEY |
| Database connection failed | Wait 10s for PostgreSQL to initialize, check `docker compose logs db` |
| Frontend shows blank | Check browser console, verify NEXT_PUBLIC_API_URL is set |
| Analysis times out | OpenAI API may be slow - check `docker compose logs backend` for errors |

---

## LangSmith Integration (Optional Enhancement)

To enable LangSmith tracing for debugging the LangGraph workflow:

### 1. Add to .env
```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=ls__your-langsmith-key
LANGCHAIN_PROJECT=support-ticket-analyst
```

### 2. Update backend/src/agent/graph.ts
```typescript
// Add at top of file
import { Client } from "langsmith";

// The graph will automatically trace if env vars are set
```

### 3. View Traces
Visit https://smith.langchain.com to see execution traces.

---

## Pending Enhancements

### High Priority (Before Submission)
- [ ] Verify Docker deployment works end-to-end
- [ ] Test with real OpenAI API key
- [ ] Add time estimate to README

### Nice-to-Have (If Time Permits)
- [ ] Add conditional edges to LangGraph (e.g., skip summary if < 3 tickets)
- [ ] Add LangGraph tool for sentiment analysis
- [ ] Add retry logic for OpenAI failures

---

## Quick Reference Commands

```bash
# Start everything
docker compose up --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down

# Reset database
docker compose down -v
docker compose up --build

# Run backend locally (without Docker)
cd backend && npm install && npm run dev

# Run frontend locally (without Docker)
cd frontend && npm install && npm run dev
```

---

## Contact

**Daniel Minton**
GitHub: [@DanielMinton](https://github.com/DanielMinton)
Handle: @TheModernOpossum
