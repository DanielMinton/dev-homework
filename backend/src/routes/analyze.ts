import { Router, Request, Response } from "express";
import { z } from "zod";
import { runAnalysis } from "../agent/tools";

const router = Router();

const analyzeSchema = z.object({
  ticketIds: z.array(z.number()).optional(),
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketIds } = analyzeSchema.parse(req.body);

    const runId = await runAnalysis(ticketIds);

    res.json({
      success: true,
      runId,
      status: "processing",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
      return;
    }

    console.error("Error starting analysis:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start analysis",
    });
  }
});

export default router;
