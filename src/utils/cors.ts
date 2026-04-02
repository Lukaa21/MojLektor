import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_ORIGINS = [
  "https://mojlektor.com",
  "https://www.mojlektor.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function setCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function handleCors(req: NextApiRequest, res: NextApiResponse): boolean {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
