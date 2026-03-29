"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
    throw new Error("STRIPE_SECRET_KEY environment variable must be set");
}
const stripe = new stripe_1.default(secret, {
    apiVersion: "2025-08-27.basil",
});
exports.default = stripe;
