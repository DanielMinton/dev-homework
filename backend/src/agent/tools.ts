import { db } from "../db";
import { analysisRuns } from "../db/schema";
import { eq } from "drizzle-orm";
import { createAnalysisGraph } from "./graph";

export async function runAnalysis(ticketIds?: number[]): Promise<number> {
  const [run] = await db.insert(analysisRuns).values({
    status: "pending",
    ticketCount: 0,
  }).returning();

  const graph = createAnalysisGraph();

  setTimeout(async () => {
    try {
      await graph.invoke({
        runId: run.id,
        ticketIds: ticketIds || [],
        tickets: [],
        analyses: [],
        summary: "",
        status: "pending",
      });
    } catch (error) {
      console.error("Error running analysis:", error);
      await db.update(analysisRuns).set({ status: "error" }).where(eq(analysisRuns.id, run.id));
    }
  }, 0);

  return run.id;
}
