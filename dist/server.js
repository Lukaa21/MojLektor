"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const estimate_1 = require("./routes/estimate");
const app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
const allowedOrigins = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use("/api/tokens/webhook", express_1.default.raw({ type: "application/json" }));
app.use(express_1.default.json({ limit: "2mb" }));
const estimateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
});
app.post("/api/estimate", estimateLimiter, estimate_1.estimateHandler);
exports.default = app;
