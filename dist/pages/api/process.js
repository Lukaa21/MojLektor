"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const guards_1 = require("../../auth/guards");
const processText_1 = require("../../ai/processText");
const diff_1 = require("../../core/diff");
const models_1 = require("../../core/models");
const service_1 = require("../../tokens/service");
const rateLimit_1 = require("../../middleware/rateLimit");
const processInput_1 = require("../../validation/processInput");
const tokenCost_1 = require("../../core/tokenCost");
const MAX_INPUT_CHARS = 100000;
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!(await (0, rateLimit_1.processRateLimit)(req, res)))
        return;
    const { rawText, serviceType, textType, language } = req.body;
    if (!rawText || !serviceType || !textType || !language) {
        return res.status(400).json({
            error: "rawText, serviceType, textType, and language are required",
        });
    }
    if (rawText.length > MAX_INPUT_CHARS) {
        return res.status(400).json({
            error: `Input too large. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
        });
    }
    const validation = (0, processInput_1.validateProcessInput)(serviceType, language);
    if (!validation.ok) {
        return res.status(400).json({ error: validation.error });
    }
    const user = await (0, guards_1.requireNextAuthUser)(req, res);
    if (!user) {
        return;
    }
    const tokenCost = (0, tokenCost_1.calculateTokenCost)(rawText.length, serviceType);
    const tokenCheck = await (0, service_1.consumeTokensForProcessing)(user.id, tokenCost, "/api/process");
    if (!tokenCheck.ok) {
        return res.status(402).json({
            error: {
                code: "INSUFFICIENT_TOKENS",
                message: "Nedovoljno tokena za obradu teksta.",
            },
            requiredTokens: tokenCheck.requiredTokens,
            currentBalance: tokenCheck.currentBalance,
            shortfall: tokenCheck.shortfall,
            suggestedPackage: tokenCheck.suggestedPackage,
            nextLowerPackage: tokenCheck.nextLowerPackage,
            differenceToLowerPackage: tokenCheck.differenceToLowerPackage,
            redirectPath: "/buy-tokens",
        });
    }
    let processedText;
    let cardCount;
    try {
        const result = await (0, processText_1.processText)(rawText, serviceType, textType, language);
        processedText = result.edited;
        cardCount = result.cardCount;
    }
    catch (err) {
        const refunded = await (0, service_1.refundTokensAfterFailedProcessing)(user.id, tokenCost, "/api/process");
        if (!refunded) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "REFUND_FAILED",
                    message: "AI obrada nije uspjela, a refund tokena trenutno nije moguc. Pokusajte ponovo uskoro.",
                },
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                code: "LLM_ERROR",
                message: "Doslo je do greske prilikom AI obrade.",
            },
        });
    }
    const fullDiff = (0, diff_1.createFullDiff)(rawText, processedText);
    return res.json({
        success: true,
        original: fullDiff.original,
        edited: fullDiff.edited,
        diff: fullDiff.diff,
        changes: fullDiff.changes,
        tokens: fullDiff.tokens,
        cardCount,
        remainingBalance: tokenCheck.remainingBalance,
        status: models_1.JobStatus.DONE,
    });
}
