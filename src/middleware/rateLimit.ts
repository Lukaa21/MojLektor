import type { NextApiRequest, NextApiResponse } from "next";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  keyFn?: (req: NextApiRequest) => string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

const getClientIp = (req: NextApiRequest): string => {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
};

export const createRateLimit = (name: string, config: RateLimitConfig) => {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  // Periodic cleanup to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, config.windowMs).unref();

  return async (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<boolean> => {
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

export const authRateLimit = createRateLimit("auth", {
  windowMs: 60_000,
  maxRequests: 10,
});

export const processRateLimit = createRateLimit("process", {
  windowMs: 60_000,
  maxRequests: 5,
  keyFn: (req) => {
    // Key by user cookie if available, otherwise by IP
    const cookie = req.headers?.cookie ?? "";
    const match = cookie.match(/ml_session=([^;]+)/);
    return match ? match[1].slice(0, 40) : getClientIp(req);
  },
});

export const checkoutRateLimit = createRateLimit("checkout", {
  windowMs: 60_000,
  maxRequests: 20,
});
