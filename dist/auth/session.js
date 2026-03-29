"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookie = exports.setAuthCookie = exports.getAuthFromExpressRequest = exports.getAuthFromNextRequest = exports.getAuthFromCookieHeader = exports.verifyAuthToken = exports.signAuthToken = exports.AUTH_COOKIE_NAME = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.AUTH_COOKIE_NAME = "ml_session";
const getAuthSecret = () => {
    const value = process.env.AUTH_JWT_SECRET;
    if (!value) {
        throw new Error("AUTH_JWT_SECRET must be set");
    }
    return value;
};
const parseCookies = (cookieHeader) => {
    const jar = {};
    if (!cookieHeader) {
        return jar;
    }
    for (const part of cookieHeader.split(";")) {
        const [rawKey, ...rest] = part.trim().split("=");
        if (!rawKey || rest.length === 0) {
            continue;
        }
        jar[rawKey] = decodeURIComponent(rest.join("="));
    }
    return jar;
};
const buildCookie = (name, value, maxAgeSeconds) => {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
};
const signAuthToken = (input) => jsonwebtoken_1.default.sign({ sub: input.userId, email: input.email }, getAuthSecret(), {
    expiresIn: "7d",
});
exports.signAuthToken = signAuthToken;
const verifyAuthToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, getAuthSecret());
        if (!payload?.sub || !payload?.email) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
};
exports.verifyAuthToken = verifyAuthToken;
const getAuthFromCookieHeader = (cookieHeader) => {
    const cookies = parseCookies(cookieHeader);
    const token = cookies[exports.AUTH_COOKIE_NAME];
    if (!token) {
        return null;
    }
    return (0, exports.verifyAuthToken)(token);
};
exports.getAuthFromCookieHeader = getAuthFromCookieHeader;
const getAuthFromNextRequest = (req) => (0, exports.getAuthFromCookieHeader)(req.headers.cookie);
exports.getAuthFromNextRequest = getAuthFromNextRequest;
const getAuthFromExpressRequest = (req) => (0, exports.getAuthFromCookieHeader)(req.headers.cookie);
exports.getAuthFromExpressRequest = getAuthFromExpressRequest;
const setAuthCookie = (res, token) => {
    res.setHeader("Set-Cookie", buildCookie(exports.AUTH_COOKIE_NAME, token, 60 * 60 * 24 * 7));
};
exports.setAuthCookie = setAuthCookie;
const clearAuthCookie = (res) => {
    res.setHeader("Set-Cookie", buildCookie(exports.AUTH_COOKIE_NAME, "", 0));
};
exports.clearAuthCookie = clearAuthCookie;
