# Submission Note

**Candidate:** Daniel Minton
**GitHub:** https://github.com/DanielMinton/dev-homework

---

Quick notes on my approach:

Reframed the project as a hotel guest request analyzer since it felt relevant to Flowtel's hospitality focus. The LangGraph agent uses conditional edges to handle edge cases cleanly - skips summary generation for single tickets, handles empty states gracefully.

Tech decisions:
- TypeScript backend for type safety across the full stack
- Python utilities included for data seeding and exports
- LangGraph.js over vanilla LangChain for explicit state management
- gpt-4o-mini for cost-effective inference on categorization tasks

Time spent: approximately 3 hours

What I would add with more time:
- WebSocket for real-time analysis updates instead of polling
- Voice integration via Vapi for phone-based guest requests
- Comprehensive test coverage
- Historical analytics dashboard with trend visualization

Looking forward to discussing the architecture decisions.

Daniel
