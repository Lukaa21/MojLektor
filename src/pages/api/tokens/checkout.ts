import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { requireNextAuthUser } from "../../../auth/guards";
import { getPackageById } from "../../../tokens/service";
import { checkoutRateLimit } from "../../../middleware/rateLimit";

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

  if (!(await checkoutRateLimit(req, res))) return;

  if (!stripe) {
    return res.status(500).json({ error: "Stripe nije konfigurisan." });
  }

  const { packageId } = req.body as { packageId?: string };
  if (!packageId) {
    return res.status(400).json({ error: "packageId je obavezan." });
  }

  const tokenPackage = getPackageById(packageId);
  if (!tokenPackage) {
    return res.status(400).json({ error: "Nepoznat paket." });
  }

  if (!tokenPackage.stripePriceId) {
    return res.status(500).json({
      error: "Stripe price ID nije podešen za izabrani paket.",
    });
  }

  const user = await requireNextAuthUser(req, res);
  if (!user) {
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price: tokenPackage.stripePriceId,
        },
      ],
      metadata: {
        userId: user.id,
      },
      success_url: `${appUrl}/buy-tokens?success=1`,
      cancel_url: `${appUrl}/buy-tokens?canceled=1`,
    });

    return res.status(200).json({ checkoutUrl: session.url });
  } catch {
    return res.status(500).json({ error: "Greška prilikom kreiranja checkout sesije." });
  }
}
