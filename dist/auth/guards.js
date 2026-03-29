"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireExpressAuthUser = exports.requireNextAuthUser = void 0;
const session_1 = require("./session");
const service_1 = require("../tokens/service");
const requireNextAuthUser = async (req, res) => {
    const session = (0, session_1.getAuthFromNextRequest)(req);
    if (!session) {
        res.status(401).json({ error: "Morate biti prijavljeni." });
        return null;
    }
    const user = await (0, service_1.findUserById)(session.sub);
    if (!user) {
        res.status(401).json({ error: "Nevažeća sesija." });
        return null;
    }
    return user;
};
exports.requireNextAuthUser = requireNextAuthUser;
const requireExpressAuthUser = async (req, res) => {
    const session = (0, session_1.getAuthFromExpressRequest)(req);
    if (!session) {
        res.status(401).json({ error: "Morate biti prijavljeni." });
        return null;
    }
    const user = await (0, service_1.findUserById)(session.sub);
    if (!user) {
        res.status(401).json({ error: "Nevažeća sesija." });
        return null;
    }
    return user;
};
exports.requireExpressAuthUser = requireExpressAuthUser;
