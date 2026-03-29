"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const guards_1 = require("../../../auth/guards");
const service_1 = require("../../../tokens/service");
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
    const packages = (0, service_1.getTokenPackages)().map(({ stripePriceId, ...rest }) => rest);
    return res.status(200).json({ packages });
}
