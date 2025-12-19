import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state";
import {
  fetchTicketsNode,
  analyzeTicketsNode,
  generateSummaryNode,
  persistResultsNode
} from "./nodes";

export function createAnalysisGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode("fetchTickets", fetchTicketsNode)
    .addNode("analyzeTickets", analyzeTicketsNode)
    .addNode("generateSummary", generateSummaryNode)
    .addNode("persistResults", persistResultsNode)
    .addEdge("__start__", "fetchTickets")
    .addEdge("fetchTickets", "analyzeTickets")
    .addEdge("analyzeTickets", "generateSummary")
    .addEdge("generateSummary", "persistResults")
    .addEdge("persistResults", "__end__");

  return workflow.compile();
}
