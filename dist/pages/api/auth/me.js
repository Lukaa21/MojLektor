"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const guards_1 = require("../../../auth/guards");
const rateLimit_1 = require("../../../middleware/rateLimit");
async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!(await (0, rateLimit_1.generalRateLimit)(req, res)))
        return;
    const user = await (0, guards_1.requireNextAuthUser)(req, res);
    if (!user) {
        return;
    }
    return res.status(200).json({
        user: {
            id: user.id,
            email: user.email,
            tokenBalance: user.tokenBalance,
        },
    });
}
