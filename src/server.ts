import express from "express";
import rateLimit from "express-rate-limit";
import { estimateHandler } from "./routes/estimate";

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));

const estimateLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

app.post("/api/estimate", estimateLimiter, estimateHandler);

export default app;
