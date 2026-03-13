import type { NextApiRequest, NextApiResponse } from "next";
import { requireNextAuthUser } from "../../../auth/guards";
import { getTokenPackages } from "../../../tokens/service";
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

  const packages = getTokenPackages().map(
    ({ stripePriceId, ...rest }) => rest
  );

  return res.status(200).json({ packages });
}
