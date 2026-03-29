"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentText = exports.MAX_CARD_CHARS = void 0;
exports.MAX_CARD_CHARS = 1500;
const sentenceRegex = /[^.!?]+[.!?]+\s*/g;
const splitIntoSentences = (text) => {
    const matches = text.match(sentenceRegex);
    if (!matches) {
        return text.length ? [text] : [];
    }
    const consumedLength = matches.reduce((sum, part) => sum + part.length, 0);
    const tail = text.slice(consumedLength);
    return tail.length ? [...matches, tail] : matches;
};
const hardSplit = (text, limit) => {
    const chunks = [];
    let offset = 0;
    while (offset < text.length) {
        chunks.push(text.slice(offset, offset + limit));
        offset += limit;
    }
    return chunks;
};
const segmentText = (text, limit = exports.MAX_CARD_CHARS) => {
    if (!text || !text.length) {
        return [];
    }
    const sentences = splitIntoSentences(text);
    const cards = [];
    let current = "";
    const flushCurrent = () => {
        if (current.length) {
            cards.push({
                index: cards.length,
                content: current,
                charCount: current.length,
            });
            current = "";
        }
    };
    for (const sentence of sentences) {
        if (sentence.length > limit) {
            if (current.length) {
                flushCurrent();
            }
            const hardChunks = hardSplit(sentence, limit);
            for (const chunk of hardChunks) {
                cards.push({
                    index: cards.length,
                    content: chunk,
                    charCount: chunk.length,
                });
            }
            continue;
        }
        if (current.length + sentence.length <= limit) {
            current += sentence;
            continue;
        }
        flushCurrent();
        current = sentence;
    }
    flushCurrent();
    return cards;
};
exports.segmentText = segmentText;
