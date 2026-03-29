"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const client_1 = __importDefault(require("../../../stripe/client"));
const guards_1 = require("../../../auth/guards");
const service_1 = require("../../../tokens/service");
const rateLimit_1 = require("../../../middleware/rateLimit");
const appUrl = process.env.APP_URL;
if (!appUrl) {
    throw new Error("APP_URL environment variable must be set");
}
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!(await (0, rateLimit_1.checkoutRateLimit)(req, res)))
        return;
    const { packageId } = req.body;
    if (!packageId) {
        return res.status(400).json({ error: "packageId je obavezan." });
    }
    const tokenPackage = (0, service_1.getPackageById)(packageId);
    if (!tokenPackage) {
        return res.status(400).json({ error: "Nepoznat paket." });
    }
    if (!tokenPackage.stripePriceId) {
        return res.status(500).json({
            error: "Stripe price ID nije podešen za izabrani paket.",
        });
    }
    const user = await (0, guards_1.requireNextAuthUser)(req, res);
    if (!user) {
        return;
    }
    try {
        const session = await client_1.default.checkout.sessions.create({
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
            customer_email: user.email,
            success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/buy-tokens?canceled=1`,
        });
        return res.status(200).json({ checkoutUrl: session.url });
    }
    catch {
        return res.status(500).json({ error: "Greška prilikom kreiranja checkout sesije." });
    }
}
