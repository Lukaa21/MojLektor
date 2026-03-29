import type { NextApiRequest, NextApiResponse } from "next";
import { verifyPassword } from "../../../auth/password";
import { setAuthCookie, signAuthToken } from "../../../auth/session";
import {
  checkAccountLockout,
  findUserByEmail,
  recordFailedLogin,
  resetLoginAttempts,
} from "../../../tokens/service";
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

  // Check account-level lockout before querying credentials (persists across restarts).
  const lockedUntil = await checkAccountLockout(email);
  if (lockedUntil) {
    const retryAfterSec = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
    res.setHeader("Retry-After", String(retryAfterSec));
    return res.status(429).json({
      error: "Previše neuspješnih pokušaja. Pokušajte ponovo za 15 minuta.",
    });
  }

  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    // Still record the attempt to prevent user enumeration timing attacks.
    await recordFailedLogin(email);
    return res.status(401).json({ error: "Neispravni kredencijali." });
  }

  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    await recordFailedLogin(email);
    return res.status(401).json({ error: "Neispravni kredencijali." });
  }

  // Successful login — clear the failure counter.
  await resetLoginAttempts(user.id);

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
