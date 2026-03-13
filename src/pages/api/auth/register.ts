import type { NextApiRequest, NextApiResponse } from "next";
import { hashPassword } from "../../../auth/password";
import { setAuthCookie, signAuthToken } from "../../../auth/session";
import { createUserWithPassword, findUserByEmail } from "../../../tokens/service";
import { authRateLimit } from "../../../middleware/rateLimit";

const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await authRateLimit(req, res))) return;

  const { email, password, passwordConfirmation } = req.body as {
    email?: string;
    password?: string;
    passwordConfirmation?: string;
  };

  if (!email || !password || !passwordConfirmation) {
    return res.status(400).json({ error: "Email i lozinka su obavezni." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email nije validan." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Lozinka mora imati najmanje 8 karaktera." });
  }

  if (password !== passwordConfirmation) {
    return res.status(400).json({ error: "Lozinke se ne poklapaju." });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "Korisnik već postoji." });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUserWithPassword(email, passwordHash);

  try {
    const token = signAuthToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);
  } catch {
    return res.status(500).json({ error: "Greška pri kreiranju sesije." });
  }

  return res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      tokenBalance: user.tokenBalance,
    },
  });
}
