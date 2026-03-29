"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProcessor = void 0;
const llmAdapter_1 = require("./llmAdapter");
const prompts_1 = require("./prompts");
class AIProcessor {
    async process(job, cards) {
        const results = [];
        const orderedCards = [...cards].sort((a, b) => a.index - b.index);
        for (const card of orderedCards) {
            const prompt = (0, prompts_1.buildPromptForService)(job.serviceType, card.content, job.textType, job.language);
            const content = await (0, llmAdapter_1.generate)(prompt);
            results.push({ index: card.index, content });
        }
        results.sort((a, b) => a.index - b.index);
        return results.map((item) => item.content).join("");
    }
}
exports.AIProcessor = AIProcessor;
