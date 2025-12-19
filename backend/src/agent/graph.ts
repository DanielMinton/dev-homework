import { StateGraph } from "@langchain/langgraph";
import { AgentState, AgentStateType } from "./state";
import {
  fetchTicketsNode,
  analyzeTicketsNode,
  generateSummaryNode,
  persistResultsNode
} from "./nodes";

function shouldAnalyze(state: AgentStateType): "analyzeTickets" | "noTickets" {
  if (!state.tickets || state.tickets.length === 0) {
    return "noTickets";
  }
  return "analyzeTickets";
}

function shouldGenerateSummary(state: AgentStateType): "generateSummary" | "skipSummary" {
  if (state.tickets.length < 2) {
    return "skipSummary";
  }
  return "generateSummary";
}

async function noTicketsNode(_state: AgentStateType): Promise<Partial<AgentStateType>> {
  return {
    summary: "No tickets found to analyze.",
    status: "complete",
    analyses: [],
  };
}

export function createAnalysisGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode("fetchTickets", fetchTicketsNode)
    .addNode("analyzeTickets", analyzeTicketsNode)
    .addNode("generateSummary", generateSummaryNode)
    .addNode("persistResults", persistResultsNode)
    .addNode("noTickets", noTicketsNode)
    .addEdge("__start__", "fetchTickets")
    .addConditionalEdges("fetchTickets", shouldAnalyze, {
      analyzeTickets: "analyzeTickets",
      noTickets: "noTickets",
    })
    .addConditionalEdges("analyzeTickets", shouldGenerateSummary, {
      generateSummary: "generateSummary",
      skipSummary: "persistResults",
    })
    .addEdge("generateSummary", "persistResults")
    .addEdge("noTickets", "persistResults")
    .addEdge("persistResults", "__end__");

  return workflow.compile();
}
