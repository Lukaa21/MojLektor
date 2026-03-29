"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const session_1 = require("../../../auth/session");
function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    (0, session_1.clearAuthCookie)(res);
    return res.status(200).json({ ok: true });
}
