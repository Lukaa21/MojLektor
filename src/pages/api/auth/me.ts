import type { NextApiRequest, NextApiResponse } from "next";
import { handleCors } from "../../../utils/cors";
import { requireNextAuthUser } from "../../../auth/guards";
import { generalRateLimit } from "../../../middleware/rateLimit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await generalRateLimit(req, res))) return;

  const user = await requireNextAuthUser(req, res);
  if (!user) {
    return;
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      tokenBalance: user.tokenBalance,
    },
  });
}
