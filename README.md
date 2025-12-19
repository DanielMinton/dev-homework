# Guest Request Analyst

AI-powered guest request routing for hospitality operations. Uses LangGraph.js to automatically categorize incoming requests and route them to the appropriate hotel department.

## Quick Start

```bash
# clone and setup
cd dev-homework
cp .env.example .env
# add your OPENAI_API_KEY to .env

# start with docker
docker compose up --build

# or run locally
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │   SQL   │                 │
│  Next.js 14     │────────▶│  Express API    │◀───────▶│  PostgreSQL     │
│  + shadcn/ui    │         │  + LangGraph    │         │                 │
│                 │         │                 │         │                 │
└─────────────────┘         └────────┬────────┘         └─────────────────┘
                                     │
                                     │ OpenAI
                                     ▼
                            ┌─────────────────┐
                            │  gpt-4o-mini    │
                            │  (routing)      │
                            └─────────────────┘
```

## LangGraph Workflow

The agent uses conditional edges to handle edge cases cleanly:

```
START
  │
  ▼
fetchTickets ─────┬─────────────────────────────┐
  │               │                             │
  ▼               ▼                             │
[tickets?] ── no ─▶ noTickets ──────────────────┤
  │                                             │
  │ yes                                         │
  ▼                                             │
analyzeTickets                                  │
  │                                             │
  ▼                                             │
[count >= 2?] ─ no ─────────────────────────────┤
  │                                             │
  │ yes                                         │
  ▼                                             │
generateSummary                                 │
  │                                             │
  └──────────────┬──────────────────────────────┘
                 │
                 ▼
          persistResults
                 │
                 ▼
                END
```

Skips summary generation for single requests - no need to summarize one item.

## Request Categories

The agent routes requests to hotel departments:

| Category | Description |
|----------|-------------|
| `room_service` | Food & beverage orders, delivery issues |
| `maintenance` | HVAC, plumbing, electrical, repairs |
| `housekeeping` | Cleaning, amenities, turndown |
| `front_desk` | Check-in/out, keys, room changes |
| `concierge` | Reservations, transportation, recommendations |
| `billing` | Charges, disputes, invoices |
| `noise_complaint` | Guest disturbances, construction |
| `amenities` | Pool, gym, spa, wifi |
| `vip_urgent` | High-priority guest issues |
| `other` | Miscellaneous |

## API Reference

```bash
# create requests
POST /api/tickets
{ "tickets": [{ "title": "...", "description": "..." }] }

# list all requests
GET /api/tickets

# run analysis
POST /api/analyze
{ "ticketIds": [1, 2, 3] }  # optional, analyzes all if empty

# get latest results
GET /api/analysis/latest

# get specific run
GET /api/analysis/:runId
```

## Python Utilities

Included scripts for data seeding and export:

```bash
cd scripts
pip install -r requirements.txt

# seed 27 realistic hospitality tickets
python seed_tickets.py

# export analysis to json or csv
python export_analysis.py --format json
python export_analysis.py --format csv
```

## Tech Stack

| Tech | Why |
|------|-----|
| **LangGraph.js** | Explicit state machine for agentic workflows, self-documenting |
| **gpt-4o-mini** | Fast, cheap, excellent at categorization |
| **Drizzle ORM** | Type-safe queries, lightweight, great DX |
| **Next.js 14** | App router, server components, TypeScript |
| **shadcn/ui** | Accessible components, copy-paste philosophy |
| **Framer Motion** | Declarative animations |

## Project Structure

```
├── backend/
│   └── src/
│       ├── agent/     # langgraph workflow
│       ├── db/        # drizzle schema
│       ├── routes/    # api endpoints
│       └── config/    # env validation
├── frontend/
│   └── src/
│       ├── app/       # next.js pages
│       ├── components/# react components
│       └── lib/       # api client
├── scripts/           # python utilities
└── db/
    └── init.sql       # postgres schema
```

## Development

Backend uses `tsx watch` for hot reload. Frontend uses Next.js dev server.

```bash
# backend
cd backend && npm run dev

# frontend
cd frontend && npm run dev
```

## Future Ideas

- WebSocket for real-time updates instead of polling
- Voice integration via Vapi for phone requests
- Historical analytics dashboard
- Multi-property support
- Staff assignment and escalation

---

**Daniel Minton** · [@TheModernOpossum](https://github.com/DanielMinton)
