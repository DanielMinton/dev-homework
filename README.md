# Support Ticket Analyst

An AI-powered support ticket analysis system that automatically categorizes and prioritizes customer support tickets using LangGraph.js and OpenAI.

## Quick Start

1. Clone the repository and navigate to the project directory:
```bash
cd dev-homework
```

2. Copy the environment example file and add your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Start the application with Docker Compose:
```bash
docker compose up --build
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

The first startup will initialize the PostgreSQL database with the required schema.

### Known Issues

**Next.js Build Warning**: The frontend `npm run build` encounters a static generation error with Next.js 14.2.22 + Radix UI components. This is a build-time issue only and does not affect runtime behavior. The application works perfectly in development mode (`npm run dev`) and Docker deployment. For production, consider upgrading to Next.js 15 or using Docker deployment as-is.

## Architecture

```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│                 │          │                 │          │                 │
│  Next.js        │  HTTP    │  Express API    │  SQL     │  PostgreSQL     │
│  Frontend       │ ────────▶│  + LangGraph    │◀────────▶│  Database       │
│  (Port 3000)    │          │  (Port 3001)    │          │  (Port 5432)    │
│                 │          │                 │          │                 │
└─────────────────┘          └────────┬────────┘          └─────────────────┘
                                      │
                                      │ OpenAI API
                                      ▼
                             ┌─────────────────┐
                             │                 │
                             │  GPT-4o-mini    │
                             │  (Analysis)     │
                             │                 │
                             └─────────────────┘
```

### System Flow

1. User submits support tickets through the Next.js frontend
2. Tickets are stored in PostgreSQL via the Express API
3. User triggers analysis, which invokes the LangGraph workflow
4. LangGraph agent:
   - Fetches tickets from database
   - Analyzes each ticket with OpenAI (category, priority, notes)
   - Generates an executive summary
   - Persists results to database
5. Frontend polls for results and displays the analysis

## API Reference

### POST /api/tickets
Create new support tickets.

**Request:**
```json
{
  "tickets": [
    {
      "title": "Can't access billing portal",
      "description": "Getting 403 error when viewing invoices"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "id": 1,
      "title": "Can't access billing portal",
      "description": "Getting 403 error when viewing invoices",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/tickets
Retrieve all tickets.

**Response:**
```json
{
  "success": true,
  "tickets": [...]
}
```

### POST /api/analyze
Start an analysis run for all tickets or specific ticket IDs.

**Request:**
```json
{
  "ticketIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "runId": 1,
  "status": "processing"
}
```

### GET /api/analysis/latest
Get the most recent analysis run with full results.

**Response:**
```json
{
  "success": true,
  "run": {
    "id": 1,
    "createdAt": "2024-01-15T10:35:00Z",
    "summary": "Analysis of 5 tickets reveals...",
    "status": "complete",
    "ticketCount": 5
  },
  "analyses": [
    {
      "id": 1,
      "category": "billing",
      "priority": "high",
      "notes": "User unable to access critical billing functionality",
      "ticket": {
        "id": 1,
        "title": "Can't access billing portal",
        "description": "Getting 403 error when viewing invoices"
      }
    }
  ]
}
```

### GET /api/analysis/:runId
Get a specific analysis run by ID.

## LangGraph Agent

The analysis workflow is implemented as a LangGraph state machine with four sequential nodes:

```
START → fetchTickets → analyzeTickets → generateSummary → persistResults → END
```

### Node Descriptions

1. **fetchTickets**: Queries PostgreSQL for tickets to analyze (either all tickets or a filtered subset)

2. **analyzeTickets**: For each ticket, invokes OpenAI with structured output to extract:
   - `category`: billing, bug, feature_request, account, technical_support, or other
   - `priority`: low, medium, or high
   - `notes`: Brief explanation of categorization

3. **generateSummary**: Uses OpenAI to create an executive summary highlighting:
   - Overall trends in ticket categories
   - Priority distribution
   - Critical issues requiring attention

4. **persistResults**: Writes analysis run metadata and individual ticket analyses to PostgreSQL

### State Definition

```typescript
{
  runId: number,                    // Analysis run identifier
  ticketIds: number[],              // Tickets to analyze
  tickets: Ticket[],                // Fetched ticket data
  analyses: TicketAnalysis[],       // Analysis results
  summary: string,                  // Executive summary
  status: "pending" | "analyzing" | "complete" | "error"
}
```

### AI Model Configuration

- Model: `gpt-4o-mini` (fast, cost-effective)
- Temperature: `0.3` (balanced consistency and creativity)
- Structured output: Zod schemas ensure type-safe responses

## Tech Stack

| Technology | Purpose | Justification |
|------------|---------|---------------|
| **LangGraph.js** | Agentic workflow orchestration | Native TypeScript support, deterministic state management, perfect for multi-step AI workflows |
| **OpenAI GPT-4o-mini** | Language model for analysis | Cost-effective, fast inference, excellent at categorization tasks |
| **PostgreSQL** | Primary database | ACID compliance, robust joins for analysis queries, production-grade reliability |
| **Drizzle ORM** | Type-safe database queries | First-class TypeScript support, lightweight, excellent DX |
| **Express.js** | Backend API framework | Minimalist, well-understood, easy to extend |
| **Next.js 14** | Frontend framework | App Router for modern React patterns, excellent TypeScript integration, built-in optimizations |
| **shadcn/ui** | Component library | Accessible, customizable, copy-paste philosophy reduces bundle size |
| **Tailwind CSS** | Styling | Utility-first approach, excellent with component-based architecture |
| **Framer Motion** | Animations | Declarative API, smooth transitions for polished UX |
| **Docker Compose** | Development environment | Consistent dev/prod parity, easy onboarding, isolated services |

## Configuration

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:postgres@db:5432/tickets
OPENAI_API_KEY=sk-...
PORT=3001
NODE_ENV=development
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database Schema

**tickets**
- `id`: Serial primary key
- `title`: Ticket title (varchar 255)
- `description`: Detailed description (text)
- `created_at`: Timestamp with timezone

**analysis_runs**
- `id`: Serial primary key
- `created_at`: Timestamp with timezone
- `summary`: AI-generated summary (text)
- `status`: pending | analyzing | complete | error
- `ticket_count`: Number of tickets analyzed

**ticket_analysis**
- `id`: Serial primary key
- `analysis_run_id`: Foreign key to analysis_runs
- `ticket_id`: Foreign key to tickets
- `category`: Categorization result
- `priority`: Priority level (low | medium | high)
- `notes`: Analysis notes
- `created_at`: Timestamp with timezone

## Development

### Running Locally Without Docker

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Database:**
```bash
psql -U postgres -d tickets -f db/init.sql
```

### Project Structure

```
dev-homework/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── agent/       # LangGraph workflow
│   │   ├── db/          # Drizzle schema & client
│   │   ├── routes/      # API endpoints
│   │   └── config/      # Environment validation
│   └── Dockerfile
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── app/        # App Router pages
│   │   ├── components/ # React components
│   │   └── lib/        # API client & utilities
│   └── Dockerfile
├── db/
│   └── init.sql        # PostgreSQL schema
└── docker-compose.yml  # Multi-container orchestration
```

## Tradeoffs & Decisions

### Time Constraints
This implementation prioritizes demonstrating LangGraph.js expertise and clean architecture over feature completeness. Given more time, I would add:

- **WebSocket Support**: Real-time analysis updates instead of polling
- **Batch Processing**: Queue-based system for handling large ticket volumes
- **User Authentication**: Multi-tenant support with isolated ticket spaces
- **Advanced Filters**: Search, date ranges, category filtering
- **Analytics Dashboard**: Trends over time, category distributions
- **Rate Limiting**: API throttling to prevent abuse
- **Comprehensive Testing**: Unit tests, integration tests, E2E tests

### Design Choices

**Why LangGraph over LangChain Chains?**
LangGraph provides explicit state management and makes the workflow self-documenting. The graph structure is easier to debug and extend than nested chain callbacks.

**Why Drizzle over Prisma?**
Drizzle offers better TypeScript inference and generates more efficient SQL. The schema-first approach aligns well with our existing PostgreSQL init script.

**Why Polling over WebSockets?**
Polling is simpler to implement and debug for a take-home project. WebSockets would be the right choice for production at scale.

**Why gpt-4o-mini over gpt-4?**
Categorization tasks don't require reasoning capabilities of larger models. gpt-4o-mini provides excellent results at a fraction of the cost and latency.

## Future Improvements

### High Priority
- Add comprehensive error handling with retry logic
- Implement request/response logging for debugging
- Add database migrations system for schema evolution
- Create API rate limiting middleware
- Add input sanitization and validation layer

### Medium Priority
- Build admin dashboard for analysis run history
- Add export functionality (CSV, JSON, PDF reports)
- Implement caching layer (Redis) for frequent queries
- Add ticket assignment and status tracking
- Create automated testing suite

### Nice to Have
- Multi-language support for international tickets
- Sentiment analysis alongside categorization
- Automated ticket routing to support teams
- Integration with ticketing systems (Zendesk, Jira)
- Custom category training with few-shot examples

## Sample Data

Test the system with these example tickets:

```json
[
  {
    "title": "Can't access billing portal",
    "description": "I keep getting a 403 error when trying to view my invoices. This started happening after the last update."
  },
  {
    "title": "Feature request: Dark mode",
    "description": "Would love to have a dark mode option. Working late nights and the bright UI is hard on the eyes."
  },
  {
    "title": "App crashes on file upload",
    "description": "Every time I try to upload a file larger than 10MB, the entire app crashes. Using Chrome on Mac."
  },
  {
    "title": "How do I upgrade my plan?",
    "description": "I want to upgrade from Basic to Pro but can't find where to do this in settings."
  },
  {
    "title": "Integration with Slack not working",
    "description": "Set up the Slack integration yesterday but notifications aren't coming through. Already checked permissions."
  }
]
```

## License

MIT

## Contact

For questions or feedback about this implementation, please open an issue in the repository.
