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

const TicketAnalysisSchema = z.object({
  category: z.enum(["billing", "bug", "feature_request", "account", "technical_support", "other"])
    .describe("The category that best describes this support ticket"),
  priority: z.enum(["low", "medium", "high"])
    .describe("The priority level based on urgency and impact"),
  notes: z.string()
    .describe("Brief explanation of the categorization and priority decision"),
});

const SummarySchema = z.object({
  summary: z.string()
    .describe("A concise summary of all analyzed tickets, highlighting key trends and critical issues"),
});

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
    const structuredModel = model.withStructuredOutput(TicketAnalysisSchema);
    const analyses = [];

    for (const ticket of state.tickets) {
      const prompt = `Analyze the following support ticket and categorize it appropriately.

Title: ${ticket.title}
Description: ${ticket.description}

Determine:
1. The category that best fits this ticket
2. The priority level (consider urgency, impact on user, and business criticality)
3. Brief notes explaining your categorization`;

      const result = await structuredModel.invoke(prompt);

      analyses.push({
        ticketId: ticket.id,
        category: result.category,
        priority: result.priority,
        notes: result.notes,
      });
    }

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
    const structuredModel = model.withStructuredOutput(SummarySchema);

    const ticketSummaries = state.tickets.map((ticket, idx) => {
      const analysis = state.analyses[idx];
      return `- [${analysis.priority.toUpperCase()}] [${analysis.category}] ${ticket.title}: ${analysis.notes}`;
    }).join("\n");

    const prompt = `You are analyzing a batch of support tickets. Generate a concise executive summary highlighting:
- Overall trends in ticket categories
- Distribution of priority levels
- Any critical issues requiring immediate attention
- Key insights for the support team

Analyzed Tickets:
${ticketSummaries}

Provide a clear, actionable summary in 2-3 paragraphs.`;

    const result = await structuredModel.invoke(prompt);

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

    for (const analysis of state.analyses) {
      await db.insert(ticketAnalysis).values({
        analysisRunId: state.runId,
        ticketId: analysis.ticketId,
        category: analysis.category,
        priority: analysis.priority,
        notes: analysis.notes,
      });
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
