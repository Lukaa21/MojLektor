import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { requireNextAuthUser } from "../../../auth/guards";

const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripe) {
    return res.status(500).json({ error: "Stripe nije konfigurisan." });
  }

  const user = await requireNextAuthUser(req, res);
  if (!user) {
    return;
  }

  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (!sessionId) {
    return res.status(400).json({ error: "session_id je obavezan." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent", "customer_details"],
    });

    if (session.metadata?.userId !== user.id) {
      return res.status(403).json({ error: "Sesija ne pripada prijavljenom korisniku." });
    }

    return res.status(200).json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email || null,
    });
  } catch {
    return res.status(404).json({ error: "Checkout sesija nije pronađena." });
  }
}
