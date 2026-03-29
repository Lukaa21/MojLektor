"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateHandler = exports.calculateEstimate = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const guards_1 = require("../auth/guards");
const fileExtractor_1 = require("../core/fileExtractor");
const service_1 = require("../tokens/service");
const processInput_1 = require("../validation/processInput");
const parseMultipart_1 = require("../utils/parseMultipart");
const tokenCost_1 = require("../core/tokenCost");
const MAX_INPUT_CHARS = 100000;
const calculateEstimate = ({ rawText, serviceType, textType, language, userId, }) => {
    if (!rawText || !serviceType || !textType || !language) {
        return {
            ok: false,
            status: 400,
            body: {
                error: "rawText, serviceType, textType, and language are required",
            },
        };
    }
    const validation = (0, processInput_1.validateProcessInput)(serviceType, language);
    if (!validation.ok) {
        return {
            ok: false,
            status: 400,
            body: { error: validation.error },
        };
    }
    if (rawText.length > MAX_INPUT_CHARS) {
        return {
            ok: false,
            status: 400,
            body: {
                error: `Input too large. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
            },
        };
    }
    return (0, service_1.getEstimateForTokens)(userId, (0, tokenCost_1.calculateTokenCost)(rawText.length, serviceType)).then((estimate) => ({
        ok: true,
        status: 200,
        body: {
            rawText,
            requiredTokens: estimate.requiredTokens,
            currentBalance: estimate.currentBalance,
            canProcess: estimate.canProcess,
            suggestedPackage: estimate.suggestedPackage,
            recommendedPackagePrice: estimate.recommendedPackagePrice,
            nextLowerPackage: estimate.nextLowerPackage,
            differenceToLowerPackage: estimate.differenceToLowerPackage,
            serviceType,
            textType,
            language,
        },
    }));
};
exports.calculateEstimate = calculateEstimate;
const estimateHandler = async (req, res) => {
    const user = await (0, guards_1.requireExpressAuthUser)(req, res);
    if (!user) {
        return;
    }
    const userId = user.id;
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
        let uploadedFile = null;
        try {
            const { fields, files } = await (0, parseMultipart_1.parseMultipart)(req);
            const file = files.file;
            uploadedFile = Array.isArray(file) ? file[0] : file ?? null;
            if (!uploadedFile || !uploadedFile.originalFilename) {
                return res.status(400).json({
                    error: {
                        code: "FILE_MISSING_ERROR",
                        message: "Fajl je obavezan.",
                    },
                });
            }
            if (!(0, fileExtractor_1.validateExtension)(uploadedFile.originalFilename)) {
                return res.status(400).json({
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
            const rawText = await (0, fileExtractor_1.extractText)(uploadedFile.filepath, uploadedFile.originalFilename);
            const result = await (0, exports.calculateEstimate)({
                rawText,
                serviceType: serviceTypeRaw,
                textType: textTypeRaw || "",
                language: languageRaw,
                userId,
            });
            return res.status(result.status).json(result.body);
        }
        catch (error) {
            if (error instanceof fileExtractor_1.FileExtractionError) {
                const status = error.code === "FILE_PARSE_ERROR" ? 500 : 400;
                return res.status(status).json({
                    error: {
                        code: error.code,
                        message: error.message,
                    },
                });
            }
            return res.status(500).json({
                error: {
                    code: "UPLOAD_ERROR",
                    message: "Doslo je do greske prilikom procjene fajla.",
                },
            });
        }
        finally {
            if (uploadedFile?.filepath) {
                await promises_1.default.unlink(uploadedFile.filepath).catch(() => undefined);
            }
        }
    }
    const { rawText, serviceType, textType, language } = req.body;
    const result = await (0, exports.calculateEstimate)({
        rawText: rawText || "",
        serviceType: serviceType,
        textType: textType || "",
        language: language,
        userId,
    });
    return res.status(result.status).json(result.body);
};
exports.estimateHandler = estimateHandler;
