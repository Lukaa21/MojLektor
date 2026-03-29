"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageForRequiredTokens = exports.getPackageByStripePriceId = exports.getPackageById = exports.applyCompletedCheckoutEvent = exports.getEstimateForTokens = exports.refundTokensAfterFailedProcessing = exports.consumeTokensForProcessing = exports.addTokensToUser = exports.getUserTokenBalance = exports.createUserWithPassword = exports.findUserById = exports.findUserByEmail = exports.getOrCreateUser = exports.getTokenPackages = void 0;
const prisma_1 = require("../db/prisma");
const tokenPackages_1 = require("../core/tokenPackages");
const inMemoryUsers = new Map();
const inMemoryUsersByEmail = new Map();
const inMemoryPurchases = new Set();
const inMemoryProcessedStripeEvents = new Set();
if (process.env.NODE_ENV === "production" &&
    process.env.USE_IN_MEMORY_TOKENS === "1") {
    throw new Error("USE_IN_MEMORY_TOKENS cannot be enabled in production.");
}
const useMemoryStore = process.env.NODE_ENV !== "production" &&
    (process.env.NODE_ENV === "test" || process.env.USE_IN_MEMORY_TOKENS === "1");
const hasDatabase = Boolean(process.env.DATABASE_URL);
const defaultBalance = process.env.NODE_ENV === "test" ? 1000000 : 0;
const normalizeUserId = (value) => {
    const trimmed = value?.trim();
    if (!trimmed) {
        throw new Error("Invalid userId: userId must be a non-empty string");
    }
    return trimmed;
};
const normalizeEmail = (value) => value.trim().toLowerCase();
const ensureDatabaseConfigured = () => {
    if (!useMemoryStore && !hasDatabase) {
        throw new Error("DATABASE_URL is required. Configure PostgreSQL before running auth/token flows.");
    }
};
const ensureMemoryUser = (userId) => {
    const existing = inMemoryUsers.get(userId);
    if (existing) {
        return existing;
    }
    const created = {
        id: userId,
        email: `${userId}@local.demo`,
        tokenBalance: defaultBalance,
    };
    inMemoryUsers.set(userId, created);
    inMemoryUsersByEmail.set(created.email, created.id);
    return created;
};
const getTokenPackages = () => tokenPackages_1.TOKEN_PACKAGES;
exports.getTokenPackages = getTokenPackages;
const getOrCreateUser = async (userId) => {
    const normalized = normalizeUserId(userId);
    ensureDatabaseConfigured();
    if (useMemoryStore) {
        return ensureMemoryUser(normalized);
    }
    try {
        const existing = await prisma_1.prisma.user.findUnique({ where: { id: normalized } });
        if (existing) {
            return existing;
        }
        return await prisma_1.prisma.user.create({
            data: {
                id: normalized,
                email: `${normalized}@local.demo`,
                tokenBalance: defaultBalance,
            },
        });
    }
    catch {
        throw new Error("Failed to resolve user in database.");
    }
};
exports.getOrCreateUser = getOrCreateUser;
const findUserByEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    ensureDatabaseConfigured();
    if (useMemoryStore) {
        const userId = inMemoryUsersByEmail.get(normalizedEmail);
        if (!userId) {
            return null;
        }
        return inMemoryUsers.get(userId) || null;
    }
    try {
        return await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
    }
    catch {
        return null;
    }
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (userId) => {
    const normalized = normalizeUserId(userId);
    ensureDatabaseConfigured();
    if (useMemoryStore) {
        return inMemoryUsers.get(normalized) || null;
    }
    try {
        return await prisma_1.prisma.user.findUnique({ where: { id: normalized } });
    }
    catch {
        return null;
    }
};
exports.findUserById = findUserById;
const createUserWithPassword = async (email, passwordHash) => {
    const normalizedEmail = normalizeEmail(email);
    ensureDatabaseConfigured();
    if (useMemoryStore) {
        const existingId = inMemoryUsersByEmail.get(normalizedEmail);
        if (existingId) {
            throw new Error("EMAIL_ALREADY_EXISTS");
        }
        const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const created = {
            id: userId,
            email: normalizedEmail,
            tokenBalance: defaultBalance,
            passwordHash,
        };
        inMemoryUsers.set(userId, created);
        inMemoryUsersByEmail.set(normalizedEmail, userId);
        return created;
    }
    return prisma_1.prisma.user.create({
        data: {
            email: normalizedEmail,
            passwordHash,
            tokenBalance: defaultBalance,
        },
    });
};
exports.createUserWithPassword = createUserWithPassword;
const getUserTokenBalance = async (userId) => {
    const user = await (0, exports.findUserById)(userId);
    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }
    return user.tokenBalance;
};
exports.getUserTokenBalance = getUserTokenBalance;
const addTokensToUser = async (userId, amount, meta) => {
    ensureDatabaseConfigured();
    const safeAmount = Math.max(0, Math.floor(amount));
    if (!safeAmount) {
        return (0, exports.getOrCreateUser)(userId);
    }
    if (useMemoryStore) {
        if (meta?.checkoutSessionId) {
            if (inMemoryPurchases.has(meta.checkoutSessionId)) {
                return ensureMemoryUser(userId);
            }
            inMemoryPurchases.add(meta.checkoutSessionId);
        }
        const user = ensureMemoryUser(userId);
        user.tokenBalance += safeAmount;
        inMemoryUsers.set(user.id, user);
        return user;
    }
    try {
        const user = await (0, exports.getOrCreateUser)(userId);
        return await prisma_1.prisma.$transaction(async (tx) => {
            if (meta?.checkoutSessionId) {
                const existingPurchase = await tx.tokenPurchase.findUnique({
                    where: { stripeCheckoutSessionId: meta.checkoutSessionId },
                });
                if (existingPurchase?.status === "CONFIRMED") {
                    return user;
                }
            }
            const updated = await tx.user.update({
                where: { id: user.id },
                data: { tokenBalance: { increment: safeAmount } },
            });
            if (meta?.packageId) {
                await tx.tokenPurchase.upsert({
                    where: {
                        stripeCheckoutSessionId: meta.checkoutSessionId || `${updated.id}-${meta.paymentIntentId || "manual"}`,
                    },
                    update: {
                        status: "CONFIRMED",
                        tokensGranted: safeAmount,
                        stripePaymentIntentId: meta.paymentIntentId,
                    },
                    create: {
                        userId: updated.id,
                        tokenPackageId: meta.packageId,
                        stripeCheckoutSessionId: meta.checkoutSessionId || `${updated.id}-${meta.paymentIntentId || "manual"}`,
                        stripePaymentIntentId: meta.paymentIntentId,
                        status: "CONFIRMED",
                        tokensGranted: safeAmount,
                    },
                });
            }
            return updated;
        });
    }
    catch {
        throw new Error("Failed to add tokens in database.");
    }
};
exports.addTokensToUser = addTokensToUser;
const consumeTokensForProcessing = async (userId, requiredTokens, endpoint) => {
    ensureDatabaseConfigured();
    const required = Math.max(0, Math.floor(requiredTokens));
    const user = await (0, exports.findUserById)(userId);
    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }
    const suggestion = (0, tokenPackages_1.getTokenPackageSuggestion)(required);
    const buildInsufficientResponse = (balance) => ({
        ok: false,
        currentBalance: balance,
        requiredTokens: required,
        shortfall: Math.max(0, required - balance),
        suggestedPackage: suggestion.requiredPackage,
        nextLowerPackage: suggestion.nextLowerPackage,
        differenceToLowerPackage: suggestion.differenceToLowerPackage,
    });
    if (required === 0) {
        return {
            ok: true,
            remainingBalance: user.tokenBalance,
            requiredTokens: 0,
        };
    }
    if (useMemoryStore) {
        const updated = ensureMemoryUser(user.id);
        if (updated.tokenBalance < required) {
            return buildInsufficientResponse(updated.tokenBalance);
        }
        updated.tokenBalance -= required;
        inMemoryUsers.set(updated.id, updated);
        return {
            ok: true,
            remainingBalance: updated.tokenBalance,
            requiredTokens: required,
        };
    }
    try {
        const txResult = await prisma_1.prisma.$transaction(async (tx) => {
            // Atomic spend guard: only deduct when tokenBalance >= required.
            const spendResult = await tx.user.updateMany({
                where: {
                    id: user.id,
                    tokenBalance: { gte: required },
                },
                data: {
                    tokenBalance: { decrement: required },
                },
            });
            if (spendResult.count === 0) {
                const latest = await tx.user.findUnique({
                    where: { id: user.id },
                    select: { tokenBalance: true },
                });
                return {
                    ok: false,
                    currentBalance: latest?.tokenBalance ?? 0,
                };
            }
            const updated = await tx.user.findUnique({
                where: { id: user.id },
                select: { tokenBalance: true },
            });
            await tx.tokenUsage.create({
                data: {
                    userId: user.id,
                    endpoint,
                    charactersUsed: required,
                    tokensDeducted: required,
                },
            });
            return {
                ok: true,
                remainingBalance: updated?.tokenBalance ?? 0,
            };
        });
        if (!txResult.ok) {
            return buildInsufficientResponse(txResult.currentBalance);
        }
        return {
            ok: true,
            remainingBalance: txResult.remainingBalance,
            requiredTokens: required,
        };
    }
    catch {
        throw new Error("Failed to consume tokens in database.");
    }
};
exports.consumeTokensForProcessing = consumeTokensForProcessing;
/**
 * Restores tokens after AI processing failed.
 * Returns true only when user balance increment was persisted.
 */
const refundTokensAfterFailedProcessing = async (userId, amount, endpoint) => {
    ensureDatabaseConfigured();
    const refund = Math.max(0, Math.floor(amount));
    if (!refund) {
        return true;
    }
    const id = normalizeUserId(userId);
    if (useMemoryStore) {
        const updated = ensureMemoryUser(id);
        updated.tokenBalance += refund;
        inMemoryUsers.set(updated.id, updated);
        return true;
    }
    // Keep balance restoration independent from audit logging.
    // If tokenUsage logging fails, user must still receive refunded tokens.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await prisma_1.prisma.user.update({
                where: { id },
                data: { tokenBalance: { increment: refund } },
            });
            try {
                await prisma_1.prisma.tokenUsage.create({
                    data: {
                        userId: id,
                        endpoint: `${endpoint}#refund`,
                        charactersUsed: 0,
                        tokensDeducted: -refund,
                    },
                });
            }
            catch {
                console.error("[tokens] Refund audit logging failed", {
                    userId: id,
                    refund,
                    endpoint,
                });
            }
            return true;
        }
        catch {
            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 100));
                continue;
            }
            console.error("[tokens] Refund balance update failed", {
                userId: id,
                refund,
                endpoint,
            });
            return false;
        }
    }
    return false;
};
exports.refundTokensAfterFailedProcessing = refundTokensAfterFailedProcessing;
const getEstimateForTokens = async (userId, requiredTokens) => {
    const currentBalance = await (0, exports.getUserTokenBalance)(userId);
    const suggestion = (0, tokenPackages_1.getTokenPackageSuggestion)(requiredTokens);
    return {
        requiredTokens,
        currentBalance,
        canProcess: currentBalance >= requiredTokens,
        suggestedPackage: suggestion.requiredPackage,
        recommendedPackagePrice: suggestion.requiredPackage?.priceEur ?? null,
        nextLowerPackage: suggestion.nextLowerPackage,
        differenceToLowerPackage: suggestion.differenceToLowerPackage,
    };
};
exports.getEstimateForTokens = getEstimateForTokens;
const applyCompletedCheckoutEvent = async ({ stripeEventId, userId, stripePriceId, checkoutSessionId, paymentIntentId, }) => {
    ensureDatabaseConfigured();
    const normalizedUserId = normalizeUserId(userId);
    const tokenPackage = (0, exports.getPackageByStripePriceId)(stripePriceId);
    if (!tokenPackage) {
        return { applied: false, reason: "unknown_price" };
    }
    if (useMemoryStore) {
        if (inMemoryProcessedStripeEvents.has(stripeEventId)) {
            return { applied: false, reason: "duplicate_event" };
        }
        inMemoryProcessedStripeEvents.add(stripeEventId);
        await (0, exports.addTokensToUser)(normalizedUserId, tokenPackage.tokenAmount, {
            checkoutSessionId,
            paymentIntentId,
            packageId: tokenPackage.id,
        });
        return { applied: true };
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const alreadyProcessed = await tx.processedStripeEvent.findUnique({
            where: { eventId: stripeEventId },
        });
        if (alreadyProcessed) {
            return { applied: false, reason: "duplicate_event" };
        }
        await tx.processedStripeEvent.create({
            data: { eventId: stripeEventId },
        });
        const user = await tx.user.findUnique({
            where: { id: normalizedUserId },
        });
        if (!user) {
            return { applied: false, reason: "unknown_user" };
        }
        const existingPurchase = await tx.tokenPurchase.findUnique({
            where: { stripeCheckoutSessionId: checkoutSessionId },
        });
        if (existingPurchase?.status === "CONFIRMED") {
            return { applied: false, reason: "purchase_already_confirmed" };
        }
        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: {
                tokenBalance: { increment: tokenPackage.tokenAmount },
            },
        });
        await tx.tokenPurchase.upsert({
            where: { stripeCheckoutSessionId: checkoutSessionId },
            update: {
                status: "CONFIRMED",
                tokensGranted: tokenPackage.tokenAmount,
                stripePaymentIntentId: paymentIntentId,
                tokenPackageId: tokenPackage.id,
            },
            create: {
                userId: user.id,
                tokenPackageId: tokenPackage.id,
                stripeCheckoutSessionId: checkoutSessionId,
                stripePaymentIntentId: paymentIntentId,
                status: "CONFIRMED",
                tokensGranted: tokenPackage.tokenAmount,
            },
        });
        return {
            applied: true,
            balance: updatedUser.tokenBalance,
        };
    });
};
exports.applyCompletedCheckoutEvent = applyCompletedCheckoutEvent;
const getPackageById = (packageId) => tokenPackages_1.TOKEN_PACKAGES.find((pkg) => pkg.id === packageId);
exports.getPackageById = getPackageById;
const getPackageByStripePriceId = (stripePriceId) => tokenPackages_1.TOKEN_PACKAGES.find((pkg) => pkg.stripePriceId === stripePriceId);
exports.getPackageByStripePriceId = getPackageByStripePriceId;
const getPackageForRequiredTokens = (requiredTokens) => (0, tokenPackages_1.getRequiredPackage)(requiredTokens);
exports.getPackageForRequiredTokens = getPackageForRequiredTokens;
