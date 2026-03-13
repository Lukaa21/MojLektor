import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { estimateHandler } from "./routes/estimate";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const allowedOrigins = [
  process.env.APP_URL,
  process.env.NEXT_PUBLIC_API_BASE_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

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
