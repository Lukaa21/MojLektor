"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenPackageSuggestion = exports.getNextLowerPackage = exports.getRequiredPackage = exports.TOKEN_PACKAGES = void 0;
exports.TOKEN_PACKAGES = [
    {
        id: "pkg_3000",
        tokenAmount: 3000,
        priceEur: 5,
        stripePriceId: process.env.STRIPE_PRICE_ID_3000,
    },
    {
        id: "pkg_7000",
        tokenAmount: 7000,
        priceEur: 9,
        stripePriceId: process.env.STRIPE_PRICE_ID_7000,
    },
    {
        id: "pkg_15000",
        tokenAmount: 15000,
        priceEur: 14,
        stripePriceId: process.env.STRIPE_PRICE_ID_15000,
    },
];
const getRequiredPackage = (requiredTokens) => exports.TOKEN_PACKAGES.find((pkg) => pkg.tokenAmount >= requiredTokens) ||
    exports.TOKEN_PACKAGES[exports.TOKEN_PACKAGES.length - 1];
exports.getRequiredPackage = getRequiredPackage;
const getNextLowerPackage = (requiredTokens) => {
    const lower = exports.TOKEN_PACKAGES.filter((pkg) => pkg.tokenAmount < requiredTokens);
    if (!lower.length) {
        return null;
    }
    return lower[lower.length - 1];
};
exports.getNextLowerPackage = getNextLowerPackage;
const getTokenPackageSuggestion = (requiredTokens) => {
    const requiredPackage = (0, exports.getRequiredPackage)(requiredTokens);
    const nextLowerPackage = (0, exports.getNextLowerPackage)(requiredTokens);
    return {
        requiredPackage,
        nextLowerPackage,
        differenceToLowerPackage: nextLowerPackage
            ? requiredTokens - nextLowerPackage.tokenAmount
            : null,
    };
};
exports.getTokenPackageSuggestion = getTokenPackageSuggestion;
