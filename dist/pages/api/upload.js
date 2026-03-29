"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const promises_1 = __importDefault(require("fs/promises"));
const guards_1 = require("../../auth/guards");
const processText_1 = require("../../ai/processText");
const diff_1 = require("../../core/diff");
const fileExtractor_1 = require("../../core/fileExtractor");
const models_1 = require("../../core/models");
const service_1 = require("../../tokens/service");
const rateLimit_1 = require("../../middleware/rateLimit");
const processInput_1 = require("../../validation/processInput");
const parseMultipart_1 = require("../../utils/parseMultipart");
const tokenCost_1 = require("../../core/tokenCost");
exports.config = {
    api: {
        bodyParser: false,
    },
};
const MAX_INPUT_CHARS = 100000;
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!(await (0, rateLimit_1.processRateLimit)(req, res)))
        return;
    let uploadedFile = null;
    const user = await (0, guards_1.requireNextAuthUser)(req, res);
    if (!user) {
        return;
    }
    try {
        const { fields, files } = await (0, parseMultipart_1.parseMultipart)(req);
        const file = files.file;
        uploadedFile = Array.isArray(file) ? file[0] : file ?? null;
        if (!uploadedFile || !uploadedFile.originalFilename) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "FILE_MISSING_ERROR",
                    message: "Fajl je obavezan.",
                },
            });
        }
        if (!(0, fileExtractor_1.validateExtension)(uploadedFile.originalFilename)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "UNSUPPORTED_FILE_TYPE",
                    message: "Dozvoljeni tipovi su .txt, .pdf, .docx",
                },
            });
        }
        const serviceTypeRaw = Array.isArray(fields.serviceType)
            ? fields.serviceType[0]
            : fields.serviceType;
        const textTypeRaw = Array.isArray(fields.textType)
            ? fields.textType[0]
            : fields.textType;
        const languageRaw = Array.isArray(fields.language)
            ? fields.language[0]
            : fields.language;
        const serviceType = serviceTypeRaw;
        const textType = textTypeRaw;
        const language = languageRaw;
        if (!serviceType || !textType || !language) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "BAD_REQUEST",
                    message: "serviceType, textType i language su obavezni.",
                },
            });
        }
        const validation = (0, processInput_1.validateProcessInput)(serviceType, language);
        if (!validation.ok) {
            return res.status(400).json({
                success: false,
                error: { code: "BAD_REQUEST", message: validation.error },
            });
        }
        const original = await (0, fileExtractor_1.extractText)(uploadedFile.filepath, uploadedFile.originalFilename);
        if (original.length > MAX_INPUT_CHARS) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INPUT_TOO_LARGE",
                    message: `Input too large. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
                },
            });
        }
        const tokenCost = (0, tokenCost_1.calculateTokenCost)(original.length, serviceType);
        const tokenCheck = await (0, service_1.consumeTokensForProcessing)(user.id, tokenCost, "/api/upload");
        if (!tokenCheck.ok) {
            return res.status(402).json({
                success: false,
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
        let edited;
        let cardCount;
        try {
            const result = await (0, processText_1.processText)(original, serviceType, textType, language);
            edited = result.edited;
            cardCount = result.cardCount;
        }
        catch (aiError) {
            const refunded = await (0, service_1.refundTokensAfterFailedProcessing)(user.id, tokenCost, "/api/upload");
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
        const fullDiff = (0, diff_1.createFullDiff)(original, edited);
        return res.status(200).json({
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
    catch (error) {
        if (error instanceof fileExtractor_1.FileExtractionError) {
            const status = error.code === "FILE_PARSE_ERROR" ? 500 : 400;
            return res.status(status).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                },
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                code: "UPLOAD_ERROR",
                message: "Doslo je do greske prilikom obrade fajla.",
            },
        });
    }
    finally {
        if (uploadedFile?.filepath) {
            await promises_1.default.unlink(uploadedFile.filepath).catch(() => undefined);
        }
    }
}
