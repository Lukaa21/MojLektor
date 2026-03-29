"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProcessInput = exports.ALLOWED_LANGUAGES = void 0;
const models_1 = require("../core/models");
exports.ALLOWED_LANGUAGES = [
    "crnogorski",
    "srpski",
    "hrvatski",
    "bosanski",
];
const validateProcessInput = (serviceType, language) => {
    if (!Object.values(models_1.ServiceType).includes(serviceType)) {
        return { ok: false, error: "Invalid serviceType" };
    }
    if (!exports.ALLOWED_LANGUAGES.includes(language)) {
        return { ok: false, error: "Invalid language" };
    }
    return { ok: true };
};
exports.validateProcessInput = validateProcessInput;
