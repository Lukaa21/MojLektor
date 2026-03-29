"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const client_1 = __importDefault(require("../../../stripe/client"));
const service_1 = require("../../../tokens/service");
exports.config = {
    api: {
        bodyParser: false,
    },
};
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const readRawBody = async (req) => {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!webhookSecret) {
        return res.status(500).json({ error: "Stripe webhook nije konfigurisan." });
    }
    const signature = req.headers["stripe-signature"];
    if (!signature || Array.isArray(signature)) {
        return res.status(400).json({ error: "Nedostaje Stripe potpis." });
    }
    const rawBody = await readRawBody(req);
    let event;
    try {
        event = client_1.default.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    catch {
        return res.status(400).json({ error: "Neispravan webhook potpis." });
    }
    // Ignore all webhook event types except successful checkout completion.
    if (event.type !== "checkout.session.completed") {
        return res.status(200).json({ received: true, ignored: true });
    }
    const session = event.data.object;
    if (session.payment_status !== "paid") {
        return res.status(200).json({ received: true, ignored: true });
    }
    const userId = session.metadata?.userId;
    if (!userId || !session.id) {
        return res.status(200).json({ received: true, ignored: true });
    }
    const lineItems = await client_1.default.checkout.sessions.listLineItems(session.id, {
        limit: 1,
        expand: ["data.price"],
    });
    const firstItem = lineItems.data[0];
    const stripePriceId = typeof firstItem?.price === "string"
        ? firstItem.price
        : firstItem?.price?.id;
    if (!stripePriceId) {
        return res.status(200).json({ received: true, ignored: true });
    }
    await (0, service_1.applyCompletedCheckoutEvent)({
        stripeEventId: event.id,
        userId,
        stripePriceId,
        checkoutSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined,
    });
    return res.status(200).json({ received: true });
}
