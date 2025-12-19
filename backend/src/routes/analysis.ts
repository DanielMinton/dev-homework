import { Router, Request, Response } from "express";
import { db } from "../db";
import { analysisRuns, ticketAnalysis, tickets } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/latest", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [latestRun] = await db.select()
      .from(analysisRuns)
      .orderBy(desc(analysisRuns.createdAt))
      .limit(1);

    if (!latestRun) {
      res.json({
        success: true,
        run: null,
        analyses: [],
      });
      return;
    }

    const analyses = await db.select({
      id: ticketAnalysis.id,
      category: ticketAnalysis.category,
      priority: ticketAnalysis.priority,
      notes: ticketAnalysis.notes,
      createdAt: ticketAnalysis.createdAt,
      ticket: {
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        createdAt: tickets.createdAt,
      },
    })
      .from(ticketAnalysis)
      .innerJoin(tickets, eq(ticketAnalysis.ticketId, tickets.id))
      .where(eq(ticketAnalysis.analysisRunId, latestRun.id));

    res.json({
      success: true,
      run: latestRun,
      analyses,
    });
  } catch (error) {
    console.error("Error fetching latest analysis:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch latest analysis",
    });
  }
});

router.get("/:runId", async (req: Request, res: Response): Promise<void> => {
  try {
    const runId = parseInt(req.params.runId);

    if (isNaN(runId)) {
      res.status(400).json({
        success: false,
        error: "Invalid run ID",
      });
      return;
    }

    const [run] = await db.select()
      .from(analysisRuns)
      .where(eq(analysisRuns.id, runId));

    if (!run) {
      res.status(404).json({
        success: false,
        error: "Analysis run not found",
      });
      return;
    }

    const analyses = await db.select({
      id: ticketAnalysis.id,
      category: ticketAnalysis.category,
      priority: ticketAnalysis.priority,
      notes: ticketAnalysis.notes,
      createdAt: ticketAnalysis.createdAt,
      ticket: {
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        createdAt: tickets.createdAt,
      },
    })
      .from(ticketAnalysis)
      .innerJoin(tickets, eq(ticketAnalysis.ticketId, tickets.id))
      .where(eq(ticketAnalysis.analysisRunId, runId));

    res.json({
      success: true,
      run,
      analyses,
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analysis",
    });
  }
});

export default router;
