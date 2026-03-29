"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const password_1 = require("../../../auth/password");
const session_1 = require("../../../auth/session");
const service_1 = require("../../../tokens/service");
const rateLimit_1 = require("../../../middleware/rateLimit");
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!(await (0, rateLimit_1.authRateLimit)(req, res)))
        return;
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email i lozinka su obavezni." });
    }
    const user = await (0, service_1.findUserByEmail)(email);
    if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Neispravni kredencijali." });
    }
    const isMatch = await (0, password_1.verifyPassword)(password, user.passwordHash);
    if (!isMatch) {
        return res.status(401).json({ error: "Neispravni kredencijali." });
    }
    try {
        const token = (0, session_1.signAuthToken)({ userId: user.id, email: user.email });
        (0, session_1.setAuthCookie)(res, token);
    }
    catch {
        return res.status(500).json({ error: "Greška pri kreiranju sesije." });
    }
    return res.status(200).json({
        user: {
            id: user.id,
            email: user.email,
            tokenBalance: user.tokenBalance,
        },
    });
}
