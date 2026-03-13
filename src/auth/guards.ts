import type { NextApiRequest, NextApiResponse } from "next";
import type { Request, Response } from "express";
import { getAuthFromExpressRequest, getAuthFromNextRequest } from "./session";
import { findUserById } from "../tokens/service";

export const requireNextAuthUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = getAuthFromNextRequest(req);
  if (!session) {
    res.status(401).json({ error: "Morate biti prijavljeni." });
    return null;
  }

  const user = await findUserById(session.sub);
  if (!user) {
    res.status(401).json({ error: "Nevažeća sesija." });
    return null;
  }

  return user;
};

export const requireExpressAuthUser = async (req: Request, res: Response) => {
  const session = getAuthFromExpressRequest(req);
  if (!session) {
    res.status(401).json({ error: "Morate biti prijavljeni." });
    return null;
  }

  const user = await findUserById(session.sub);
  if (!user) {
    res.status(401).json({ error: "Nevažeća sesija." });
    return null;
  }

  return user;
};
