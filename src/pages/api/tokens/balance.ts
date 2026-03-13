import type { NextApiRequest, NextApiResponse } from "next";
import { requireNextAuthUser } from "../../../auth/guards";
import { getUserTokenBalance } from "../../../tokens/service";
import { generalRateLimit } from "../../../middleware/rateLimit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await generalRateLimit(req, res))) return;

  const user = await requireNextAuthUser(req, res);
  if (!user) {
    return;
  }

  const balance = await getUserTokenBalance(user.id);

  return res.status(200).json({ userId: user.id, balance });
}
