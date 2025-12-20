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

router.get("/", async (_req: Request, res: Response): Promise<void> => {
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

// Simple auth middleware for admin operations
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "pass123";

function checkAuth(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }
  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

const updateTicketSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkAuth(req)) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "Invalid ticket ID" });
      return;
    }

    const data = updateTicketSchema.parse(req.body);
    const { eq } = await import("drizzle-orm");

    const updated = await db.update(tickets)
      .set({ title: data.title, description: data.description })
      .where(eq(tickets.id, id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    res.json({ success: true, ticket: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Invalid request data", details: error.errors });
      return;
    }
    console.error("Error updating ticket:", error);
    res.status(500).json({ success: false, error: "Failed to update ticket" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!checkAuth(req)) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "Invalid ticket ID" });
      return;
    }

    const { eq } = await import("drizzle-orm");

    const deleted = await db.delete(tickets)
      .where(eq(tickets.id, id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    res.json({ success: true, message: "Ticket deleted" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ success: false, error: "Failed to delete ticket" });
  }
});

export default router;
