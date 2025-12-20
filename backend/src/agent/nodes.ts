import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { db } from "../db";
import { tickets, ticketAnalysis, analysisRuns } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { env } from "../config/env";
import { AgentStateType } from "./state";

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
  apiKey: env.OPENAI_API_KEY,
});

// hospitality-focused categories for guest request routing
const TicketAnalysisSchema = z.object({
  category: z.enum([
    "room_service",
    "maintenance",
    "housekeeping",
    "front_desk",
    "concierge",
    "billing",
    "noise_complaint",
    "amenities",
    "vip_urgent",
    "other"
  ]).describe("The hotel department best suited to handle this request"),
  priority: z.enum(["low", "medium", "high"])
    .describe("Priority based on guest impact, safety concerns, and urgency"),
  notes: z.string()
    .describe("Brief analysis and recommended action for staff"),
});

type TicketAnalysisOutput = z.infer<typeof TicketAnalysisSchema>;

const SummarySchema = z.object({
  summary: z.string()
    .describe("Executive summary of guest requests with department routing insights"),
});

type SummaryOutput = z.infer<typeof SummarySchema>;

export async function fetchTicketsNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    let ticketsData;

    if (state.ticketIds && state.ticketIds.length > 0) {
      ticketsData = await db.select().from(tickets).where(inArray(tickets.id, state.ticketIds));
    } else {
      ticketsData = await db.select().from(tickets);
    }

    const formattedTickets = ticketsData.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
    }));

    return {
      tickets: formattedTickets,
      status: "analyzing",
    };
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return {
      status: "error",
      tickets: [],
    };
  }
}

export async function analyzeTicketsNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    // @ts-expect-error deep type instantiation limit
    const structuredModel = model.withStructuredOutput(TicketAnalysisSchema);

    // Process all tickets in parallel for much faster analysis
    const analysisPromises = state.tickets.map(async (ticket) => {
      const prompt = `You are a hotel operations AI assistant. Analyze this guest request and route it to the appropriate department.

Request: ${ticket.title}
Details: ${ticket.description}

Consider:
1. Which hotel department should handle this (room_service, maintenance, housekeeping, front_desk, concierge, billing, noise_complaint, amenities, vip_urgent, or other)
2. Priority level based on guest impact and urgency (VIP mentions, safety issues, or time-sensitive requests = high)
3. Brief notes on recommended handling approach`;

      const result = await structuredModel.invoke(prompt) as TicketAnalysisOutput;

      return {
        ticketId: ticket.id,
        category: result.category,
        priority: result.priority,
        notes: result.notes,
      };
    });

    const analyses = await Promise.all(analysisPromises);

    return {
      analyses,
      status: "analyzing",
    };
  } catch (error) {
    console.error("Error analyzing tickets:", error);
    return {
      status: "error",
      analyses: [],
    };
  }
}

export async function generateSummaryNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    const ticketSummaries = state.tickets.map((ticket, idx) => {
      const analysis = state.analyses[idx];
      return `- [${analysis.priority.toUpperCase()}] [${analysis.category}] ${ticket.title}: ${analysis.notes}`;
    }).join("\n");

    const prompt = `You are a hotel operations manager reviewing guest requests. Generate a brief executive summary highlighting:
- Department workload distribution
- High-priority items needing immediate attention
- Any patterns or recurring issues
- Recommended staffing adjustments if needed

Analyzed Requests:
${ticketSummaries}

Keep it concise - 2-3 short paragraphs max.`;

    // @ts-expect-error deep type instantiation limit
    const structuredModel = model.withStructuredOutput(SummarySchema);
    const result = await structuredModel.invoke(prompt) as SummaryOutput;

    return {
      summary: result.summary,
      status: "complete",
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    return {
      status: "error",
      summary: "Failed to generate summary",
    };
  }
}

export async function persistResultsNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    await db.update(analysisRuns)
      .set({
        summary: state.summary,
        status: state.status,
        ticketCount: state.tickets.length,
      })
      .where(eq(analysisRuns.id, state.runId));

    // Batch insert all analyses at once
    if (state.analyses.length > 0) {
      await db.insert(ticketAnalysis).values(
        state.analyses.map(analysis => ({
          analysisRunId: state.runId,
          ticketId: analysis.ticketId,
          category: analysis.category,
          priority: analysis.priority,
          notes: analysis.notes,
        }))
      );
    }

    return {
      status: "complete",
    };
  } catch (error) {
    console.error("Error persisting results:", error);
    return {
      status: "error",
    };
  }
}
