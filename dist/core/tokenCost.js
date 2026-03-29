"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTokenCost = void 0;
const models_1 = require("./models");
/**
 * LEKTURA or KOREKTURA: 2 characters = 1 token (odd counts round in user's favor).
 * BOTH: 1 character = 1 token.
 */
const calculateTokenCost = (charCount, serviceType) => {
    if (serviceType === models_1.ServiceType.BOTH) {
        return charCount;
    }
    return Math.ceil(charCount / 2);
};
exports.calculateTokenCost = calculateTokenCost;
