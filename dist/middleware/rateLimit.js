"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimit = exports.checkoutRateLimit = exports.processRateLimit = exports.authRateLimit = exports.createRateLimit = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const stores = new Map();
const getClientIp = (req) => {
    const forwarded = req.headers?.["x-forwarded-for"];
    if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }
    return req.socket?.remoteAddress ?? "unknown";
};
const createRateLimit = (name, config) => {
    if (!stores.has(name)) {
        stores.set(name, new Map());
    }
    const store = stores.get(name);
    // Periodic cleanup to prevent unbounded memory growth
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (entry.resetAt <= now) {
                store.delete(key);
            }
        }
    }, config.windowMs).unref();
    return async (req, res) => {
        const key = config.keyFn ? config.keyFn(req) : getClientIp(req);
        const now = Date.now();
        const existing = store.get(key);
        if (!existing || existing.resetAt <= now) {
            store.set(key, { count: 1, resetAt: now + config.windowMs });
            return true;
        }
        existing.count += 1;
        if (existing.count > config.maxRequests) {
            const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
            res.setHeader("Retry-After", String(retryAfterSec));
            res.status(429).json({ error: "Too many requests. Please try again later." });
            return false;
        }
        return true;
    };
};
exports.createRateLimit = createRateLimit;
exports.authRateLimit = (0, exports.createRateLimit)("auth", {
    windowMs: 60000,
    maxRequests: 10,
});
const decodeSessionCookieValue = (raw) => {
    try {
        return decodeURIComponent(raw);
    }
    catch {
        return raw;
    }
};
exports.processRateLimit = (0, exports.createRateLimit)("process", {
    windowMs: 60000,
    maxRequests: 5,
    keyFn: (req) => {
        const cookie = req.headers?.cookie ?? "";
        const match = cookie.match(/ml_session=([^;]+)/);
        if (match) {
            try {
                const decoded = jsonwebtoken_1.default.verify(decodeSessionCookieValue(match[1]), process.env.AUTH_JWT_SECRET);
                return decoded.sub;
            }
            catch {
                return getClientIp(req);
            }
        }
        return getClientIp(req);
    },
});
exports.checkoutRateLimit = (0, exports.createRateLimit)("checkout", {
    windowMs: 60000,
    maxRequests: 20,
});
exports.generalRateLimit = (0, exports.createRateLimit)("general", {
    windowMs: 60000,
    maxRequests: 60,
    keyFn: (req) => {
        const cookie = req.headers?.cookie ?? "";
        const match = cookie.match(/ml_session=([^;]+)/);
        if (match) {
            try {
                const decoded = jsonwebtoken_1.default.verify(decodeSessionCookieValue(match[1]), process.env.AUTH_JWT_SECRET);
                return decoded.sub;
            }
            catch {
                return getClientIp(req);
            }
        }
        return getClientIp(req);
    },
});
