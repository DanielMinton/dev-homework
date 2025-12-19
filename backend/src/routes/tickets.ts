import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { tickets } from "../db/schema";

const router = Router();

const createTicketsSchema = z.object({
  tickets: z.array(z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(1),
  })),
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tickets: ticketsData } = createTicketsSchema.parse(req.body);

    const insertedTickets = await db.insert(tickets)
      .values(ticketsData)
      .returning();

    res.json({
      success: true,
      tickets: insertedTickets,
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

    console.error("Error creating tickets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create tickets",
    });
  }
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const allTickets = await db.select().from(tickets).orderBy(tickets.createdAt);

    res.json({
      success: true,
      tickets: allTickets,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tickets",
    });
  }
});

export default router;
