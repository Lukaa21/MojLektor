import type { NextApiRequest, NextApiResponse } from "next";
import { verifyPassword } from "../../../auth/password";
import { setAuthCookie, signAuthToken } from "../../../auth/session";
import { findUserByEmail } from "../../../tokens/service";
import { authRateLimit } from "../../../middleware/rateLimit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await authRateLimit(req, res))) return;

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email i lozinka su obavezni." });
  }

  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Neispravni kredencijali." });
  }

  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Neispravni kredencijali." });
  }

  try {
    const token = signAuthToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);
  } catch {
    return res.status(500).json({ error: "Greška pri kreiranju sesije." });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      tokenBalance: user.tokenBalance,
    },
  });
}
