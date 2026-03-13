import type { NextApiRequest, NextApiResponse } from "next";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "ml_session";

type AuthTokenPayload = {
  sub: string;
  email: string;
};

const getAuthSecret = () => {
  const value = process.env.AUTH_JWT_SECRET;
  if (!value) {
    throw new Error("AUTH_JWT_SECRET must be set");
  }
  return value;
};

const parseCookies = (cookieHeader?: string) => {
  const jar: Record<string, string> = {};
  if (!cookieHeader) {
    return jar;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rest.length === 0) {
      continue;
    }
    jar[rawKey] = decodeURIComponent(rest.join("="));
  }
  return jar;
};

const buildCookie = (name: string, value: string, maxAgeSeconds: number) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
};

export const signAuthToken = (input: { userId: string; email: string }) =>
  jwt.sign({ sub: input.userId, email: input.email }, getAuthSecret(), {
    expiresIn: "7d",
  });

export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  try {
    const payload = jwt.verify(token, getAuthSecret()) as AuthTokenPayload;
    if (!payload?.sub || !payload?.email) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const getAuthFromCookieHeader = (cookieHeader?: string) => {
  const cookies = parseCookies(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) {
    return null;
  }
  return verifyAuthToken(token);
};

export const getAuthFromNextRequest = (req: NextApiRequest) =>
  getAuthFromCookieHeader(req.headers.cookie);

export const getAuthFromExpressRequest = (req: Request) =>
  getAuthFromCookieHeader(req.headers.cookie);

export const setAuthCookie = (
  res: NextApiResponse | Response,
  token: string
) => {
  res.setHeader("Set-Cookie", buildCookie(AUTH_COOKIE_NAME, token, 60 * 60 * 24 * 7));
};

export const clearAuthCookie = (res: NextApiResponse | Response) => {
  res.setHeader("Set-Cookie", buildCookie(AUTH_COOKIE_NAME, "", 0));
};
