"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processText = void 0;
const crypto_1 = __importDefault(require("crypto"));
const processor_1 = require("./processor");
const segmenter_1 = require("../core/segmenter");
const models_1 = require("../core/models");
const processor = new processor_1.AIProcessor();
/** Upper bound on model output length vs input (defense against runaway / injected replies). */
const assertReasonableOutputSize = (sourceChars, outputChars) => {
    const cap = Math.min(200000, Math.max(sourceChars * 8, sourceChars + 25000));
    if (outputChars > cap) {
        throw new Error("LLM_OUTPUT_BOUNDS");
    }
};
const processText = async (content, serviceType, textType, language) => {
    const cards = (0, segmenter_1.segmentText)(content);
    const job = {
        id: crypto_1.default.randomUUID(),
        rawText: content,
        serviceType,
        textType,
        language,
        cardCount: cards.length,
        status: models_1.JobStatus.CREATED,
        createdAt: new Date().toISOString(),
    };
    const edited = await processor.process(job, cards);
    assertReasonableOutputSize(content.length, edited.length);
    return {
        edited,
        cardCount: cards.length,
    };
};
exports.processText = processText;
