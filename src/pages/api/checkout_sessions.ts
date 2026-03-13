import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { requireNextAuthUser } from "../../auth/guards";
import { getPackageById } from "../../tokens/service";

const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
const appUrl = process.env.APP_URL || "http://localhost:3000";

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripe) {
    return res.status(500).json({ error: "Stripe nije konfigurisan." });
  }

  const user = await requireNextAuthUser(req, res);
  if (!user) {
    return;
  }

  const packageId =
    typeof req.body?.packageId === "string"
      ? req.body.packageId
      : typeof req.query?.packageId === "string"
        ? req.query.packageId
        : undefined;

  if (!packageId) {
    return res.status(400).json({ error: "packageId je obavezan." });
  }

  const tokenPackage = getPackageById(packageId);
  if (!tokenPackage || !tokenPackage.stripePriceId) {
    return res.status(400).json({ error: "Nepoznat paket ili nedostaje Stripe price ID." });
  }

  const origin =
    typeof req.headers.origin === "string" && req.headers.origin.trim().length > 0
      ? req.headers.origin
      : appUrl;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: tokenPackage.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/buy-tokens?canceled=1`,
    metadata: {
      userId: user.id,
      packageId: tokenPackage.id,
    },
  });

  if (!session.url) {
    return res.status(500).json({ error: "Stripe checkout URL nije dostupan." });
  }

  return res.redirect(303, session.url);
}
