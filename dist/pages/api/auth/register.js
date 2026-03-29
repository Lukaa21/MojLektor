"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const password_1 = require("../../../auth/password");
const session_1 = require("../../../auth/session");
const service_1 = require("../../../tokens/service");
const rateLimit_1 = require("../../../middleware/rateLimit");
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!(await (0, rateLimit_1.authRateLimit)(req, res)))
        return;
    const { email, password, passwordConfirmation } = req.body;
    if (!email || !password || !passwordConfirmation) {
        return res.status(400).json({ error: "Email i lozinka su obavezni." });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Email nije validan." });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "Lozinka mora imati najmanje 8 karaktera." });
    }
    if (password !== passwordConfirmation) {
        return res.status(400).json({ error: "Lozinke se ne poklapaju." });
    }
    const existing = await (0, service_1.findUserByEmail)(email);
    if (existing) {
        return res.status(409).json({ error: "Registracija nije uspjela. Pokušajte ponovo." });
    }
    const passwordHash = await (0, password_1.hashPassword)(password);
    const user = await (0, service_1.createUserWithPassword)(email, passwordHash);
    try {
        const token = (0, session_1.signAuthToken)({ userId: user.id, email: user.email });
        (0, session_1.setAuthCookie)(res, token);
    }
    catch {
        return res.status(500).json({ error: "Greška pri kreiranju sesije." });
    }
    return res.status(201).json({
        user: {
            id: user.id,
            email: user.email,
            tokenBalance: user.tokenBalance,
        },
    });
}
