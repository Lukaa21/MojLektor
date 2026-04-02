import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { estimateHandler } from "./routes/estimate";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

app.use(
  cors({
    origin: [
      "https://mojlektor.com",
      "https://www.mojlektor.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/tokens/webhook", express.raw({ type: "application/json" }));
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
