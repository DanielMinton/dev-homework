import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  runId: Annotation<number>,
  ticketIds: Annotation<number[]>,
  tickets: Annotation<Array<{ id: number; title: string; description: string }>>,
  analyses: Annotation<Array<{
    ticketId: number;
    category: string;
    priority: "low" | "medium" | "high";
    notes: string;
  }>>,
  summary: Annotation<string>,
  status: Annotation<"pending" | "analyzing" | "complete" | "error">,
});

export type AgentStateType = typeof AgentState.State;
