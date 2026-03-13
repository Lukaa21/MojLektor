import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { applyCompletedCheckoutEvent } from "../../../tokens/service";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

const readRawBody = async (req: NextApiRequest) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripe || !webhookSecret) {
    return res.status(500).json({ error: "Stripe webhook nije konfigurisan." });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: "Nedostaje Stripe potpis." });
  }

  const rawBody = await readRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return res.status(400).json({ error: "Neispravan webhook potpis." });
  }

  // Ignore all webhook event types except successful checkout completion.
  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return res.status(200).json({ received: true, ignored: true });
  }

  const userId = session.metadata?.userId;
  if (!userId || !session.id) {
    return res.status(200).json({ received: true, ignored: true });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1,
    expand: ["data.price"],
  });

  const firstItem = lineItems.data[0];
  const stripePriceId =
    typeof firstItem?.price === "string"
      ? firstItem.price
      : firstItem?.price?.id;

  if (!stripePriceId) {
    return res.status(200).json({ received: true, ignored: true });
  }

  await applyCompletedCheckoutEvent({
    stripeEventId: event.id,
    userId,
    stripePriceId,
    checkoutSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : undefined,
  });

  return res.status(200).json({ received: true });
}
