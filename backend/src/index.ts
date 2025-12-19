import express from "express";
import cors from "cors";
import { env } from "./config/env";
import ticketsRouter from "./routes/tickets";
import analyzeRouter from "./routes/analyze";
import analysisRouter from "./routes/analysis";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tickets", ticketsRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/analysis", analysisRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = parseInt(env.PORT);

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
