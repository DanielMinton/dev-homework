import { pgTable, serial, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analysisRuns = pgTable("analysis_runs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  summary: text("summary"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  ticketCount: integer("ticket_count").default(0).notNull(),
});

export const ticketAnalysis = pgTable("ticket_analysis", {
  id: serial("id").primaryKey(),
  analysisRunId: integer("analysis_run_id").references(() => analysisRuns.id, { onDelete: "cascade" }).notNull(),
  ticketId: integer("ticket_id").references(() => tickets.id, { onDelete: "cascade" }).notNull(),
  category: varchar("category", { length: 100 }),
  priority: varchar("priority", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  analysisRunIdx: index("idx_ticket_analysis_run").on(table.analysisRunId),
  ticketIdx: index("idx_ticket_analysis_ticket").on(table.ticketId),
}));

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type AnalysisRun = typeof analysisRuns.$inferSelect;
export type NewAnalysisRun = typeof analysisRuns.$inferInsert;
export type TicketAnalysis = typeof ticketAnalysis.$inferSelect;
export type NewTicketAnalysis = typeof ticketAnalysis.$inferInsert;
