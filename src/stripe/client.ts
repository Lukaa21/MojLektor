import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
if (!secret) {
  throw new Error("STRIPE_SECRET_KEY environment variable must be set");
}

const stripe = new Stripe(secret, {
  apiVersion: "2025-08-27.basil",
});

export default stripe;
