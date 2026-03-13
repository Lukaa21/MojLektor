import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import {
  TOKEN_PACKAGES,
  getTokenPackageSuggestion,
  getRequiredPackage,
} from "../core/tokenPackages";

type TokenUser = {
  id: string;
  email: string;
  tokenBalance: number;
  passwordHash?: string | null;
};

const inMemoryUsers = new Map<string, TokenUser>();
const inMemoryUsersByEmail = new Map<string, string>();
const inMemoryPurchases = new Set<string>();
const inMemoryProcessedStripeEvents = new Set<string>();

const useMemoryStore =
  process.env.NODE_ENV === "test" || process.env.USE_IN_MEMORY_TOKENS === "1";
const hasDatabase = Boolean(process.env.DATABASE_URL);

const defaultBalance = process.env.NODE_ENV === "test" ? 1000000 : 0;

const normalizeUserId = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error("Invalid userId: userId must be a non-empty string");
  }
  return trimmed;
};
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const ensureDatabaseConfigured = () => {
  if (!useMemoryStore && !hasDatabase) {
    throw new Error("DATABASE_URL is required. Configure PostgreSQL before running auth/token flows.");
  }
};

const ensureMemoryUser = (userId: string) => {
  const existing = inMemoryUsers.get(userId);
  if (existing) {
    return existing;
  }

  const created: TokenUser = {
    id: userId,
    email: `${userId}@local.demo`,
    tokenBalance: defaultBalance,
  };
  inMemoryUsers.set(userId, created);
  inMemoryUsersByEmail.set(created.email, created.id);
  return created;
};

export const getTokenPackages = () => TOKEN_PACKAGES;

export const getOrCreateUser = async (userId: string) => {
  const normalized = normalizeUserId(userId);
  ensureDatabaseConfigured();

  if (useMemoryStore) {
    return ensureMemoryUser(normalized);
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: normalized } });
    if (existing) {
      return existing;
    }

    return await prisma.user.create({
      data: {
        id: normalized,
        email: `${normalized}@local.demo`,
        tokenBalance: defaultBalance,
      },
    });
  } catch {
    throw new Error("Failed to resolve user in database.");
  }
};

export const findUserByEmail = async (email: string) => {
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
    return await prisma.user.findUnique({ where: { email: normalizedEmail } });
  } catch {
    return null;
  }
};

export const findUserById = async (userId: string) => {
  const normalized = normalizeUserId(userId);
  ensureDatabaseConfigured();

  if (useMemoryStore) {
    return inMemoryUsers.get(normalized) || null;
  }

  try {
    return await prisma.user.findUnique({ where: { id: normalized } });
  } catch {
    return null;
  }
};

export const createUserWithPassword = async (
  email: string,
  passwordHash: string
) => {
  const normalizedEmail = normalizeEmail(email);
  ensureDatabaseConfigured();

  if (useMemoryStore) {
    const existingId = inMemoryUsersByEmail.get(normalizedEmail);
    if (existingId) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const created: TokenUser = {
      id: userId,
      email: normalizedEmail,
      tokenBalance: defaultBalance,
      passwordHash,
    };
    inMemoryUsers.set(userId, created);
    inMemoryUsersByEmail.set(normalizedEmail, userId);
    return created;
  }

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      tokenBalance: defaultBalance,
    },
  });
};

export const getUserTokenBalance = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user.tokenBalance;
};

export const addTokensToUser = async (
  userId: string,
  amount: number,
  meta?: { checkoutSessionId?: string; paymentIntentId?: string; packageId?: string }
) => {
  ensureDatabaseConfigured();
  const safeAmount = Math.max(0, Math.floor(amount));
  if (!safeAmount) {
    return getOrCreateUser(userId);
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
    const user = await getOrCreateUser(userId);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
            stripeCheckoutSessionId:
              meta.checkoutSessionId || `${updated.id}-${meta.paymentIntentId || "manual"}`,
          },
          update: {
            status: "CONFIRMED",
            tokensGranted: safeAmount,
            stripePaymentIntentId: meta.paymentIntentId,
          },
          create: {
            userId: updated.id,
            tokenPackageId: meta.packageId,
            stripeCheckoutSessionId:
              meta.checkoutSessionId || `${updated.id}-${meta.paymentIntentId || "manual"}`,
            stripePaymentIntentId: meta.paymentIntentId,
            status: "CONFIRMED",
            tokensGranted: safeAmount,
          },
        });
      }

      return updated;
    });
  } catch {
    throw new Error("Failed to add tokens in database.");
  }
};

export const consumeTokensForProcessing = async (
  userId: string,
  requiredTokens: number,
  endpoint: string
) => {
  ensureDatabaseConfigured();
  const required = Math.max(0, Math.floor(requiredTokens));
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  const suggestion = getTokenPackageSuggestion(required);

  const buildInsufficientResponse = (balance: number) => ({
    ok: false as const,
    currentBalance: balance,
    requiredTokens: required,
    shortfall: Math.max(0, required - balance),
    suggestedPackage: suggestion.requiredPackage,
    nextLowerPackage: suggestion.nextLowerPackage,
    differenceToLowerPackage: suggestion.differenceToLowerPackage,
  });

  if (required === 0) {
    return {
      ok: true as const,
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
      ok: true as const,
      remainingBalance: updated.tokenBalance,
      requiredTokens: required,
    };
  }

  try {
    const txResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          ok: false as const,
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
        ok: true as const,
        remainingBalance: updated?.tokenBalance ?? 0,
      };
    });

    if (!txResult.ok) {
      return buildInsufficientResponse(txResult.currentBalance);
    }

    return {
      ok: true as const,
      remainingBalance: txResult.remainingBalance,
      requiredTokens: required,
    };
  } catch {
    throw new Error("Failed to consume tokens in database.");
  }
};

export const getEstimateForTokens = async (userId: string, requiredTokens: number) => {
  const currentBalance = await getUserTokenBalance(userId);
  const suggestion = getTokenPackageSuggestion(requiredTokens);

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

type CompletedCheckoutInput = {
  stripeEventId: string;
  userId: string;
  stripePriceId: string;
  checkoutSessionId: string;
  paymentIntentId?: string;
};

export const applyCompletedCheckoutEvent = async ({
  stripeEventId,
  userId,
  stripePriceId,
  checkoutSessionId,
  paymentIntentId,
}: CompletedCheckoutInput) => {
  ensureDatabaseConfigured();
  const normalizedUserId = normalizeUserId(userId);
  const tokenPackage = getPackageByStripePriceId(stripePriceId);
  if (!tokenPackage) {
    return { applied: false as const, reason: "unknown_price" as const };
  }

  if (useMemoryStore) {
    if (inMemoryProcessedStripeEvents.has(stripeEventId)) {
      return { applied: false as const, reason: "duplicate_event" as const };
    }
    inMemoryProcessedStripeEvents.add(stripeEventId);

    await addTokensToUser(normalizedUserId, tokenPackage.tokenAmount, {
      checkoutSessionId,
      paymentIntentId,
      packageId: tokenPackage.id,
    });

    return { applied: true as const };
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const alreadyProcessed = await tx.processedStripeEvent.findUnique({
      where: { eventId: stripeEventId },
    });

    if (alreadyProcessed) {
      return { applied: false as const, reason: "duplicate_event" as const };
    }

    await tx.processedStripeEvent.create({
      data: { eventId: stripeEventId },
    });

    const user = await tx.user.findUnique({
      where: { id: normalizedUserId },
    });

    if (!user) {
      return { applied: false as const, reason: "unknown_user" as const };
    }

    const existingPurchase = await tx.tokenPurchase.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
    });

    if (existingPurchase?.status === "CONFIRMED") {
      return { applied: false as const, reason: "purchase_already_confirmed" as const };
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
      applied: true as const,
      balance: updatedUser.tokenBalance,
    };
  });
};

export const getPackageById = (packageId: string) =>
  TOKEN_PACKAGES.find((pkg) => pkg.id === packageId);

export const getPackageByStripePriceId = (stripePriceId: string) =>
  TOKEN_PACKAGES.find((pkg) => pkg.stripePriceId === stripePriceId);

export const getPackageForRequiredTokens = (requiredTokens: number) =>
  getRequiredPackage(requiredTokens);
