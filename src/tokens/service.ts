import { randomUUID } from "crypto";
import { pool } from "../db/db";
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

if (
  process.env.NODE_ENV === "production" &&
  process.env.USE_IN_MEMORY_TOKENS === "1"
) {
  throw new Error("USE_IN_MEMORY_TOKENS cannot be enabled in production.");
}

const useMemoryStore =
  process.env.NODE_ENV !== "production" &&
  (process.env.NODE_ENV === "test" || process.env.USE_IN_MEMORY_TOKENS === "1");
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
    const { rows } = await pool.query<TokenUser>(
      `SELECT id, email, "tokenBalance", "stripeCustomerId", "passwordHash", "loginAttempts", "lockedUntil", "createdAt", "updatedAt"
       FROM "User" WHERE id = $1`,
      [normalized]
    );
    if (rows[0]) {
      return rows[0];
    }

    const { rows: created } = await pool.query<TokenUser>(
      `INSERT INTO "User" (id, email, "tokenBalance", "loginAttempts", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 0, NOW(), NOW()) RETURNING *`,
      [normalized, `${normalized}@local.demo`, defaultBalance]
    );
    return created[0];
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
    const { rows } = await pool.query<TokenUser>(
      `SELECT id, email, "passwordHash", "tokenBalance", "stripeCustomerId", "loginAttempts", "lockedUntil"
       FROM "User" WHERE email = $1`,
      [normalizedEmail]
    );
    return rows[0] ?? null;
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
    const { rows } = await pool.query<TokenUser>(
      `SELECT id, email, "tokenBalance", "stripeCustomerId", "passwordHash"
       FROM "User" WHERE id = $1`,
      [normalized]
    );
    return rows[0] ?? null;
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

  const { rows } = await pool.query<TokenUser>(
    `INSERT INTO "User" (id, email, "passwordHash", "tokenBalance", "loginAttempts", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 0, NOW(), NOW()) RETURNING id, email, "tokenBalance"`,
    [randomUUID(), normalizedEmail, passwordHash, defaultBalance]
  );
  return rows[0];
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (meta?.checkoutSessionId) {
        const { rows } = await client.query(
          `SELECT status FROM "TokenPurchase" WHERE "stripeCheckoutSessionId" = $1`,
          [meta.checkoutSessionId]
        );
        if (rows[0]?.status === "CONFIRMED") {
          await client.query("COMMIT");
          return user;
        }
      }

      const { rows: updated } = await client.query<TokenUser>(
        `UPDATE "User" SET "tokenBalance" = "tokenBalance" + $1, "updatedAt" = NOW()
         WHERE id = $2 RETURNING id, email, "tokenBalance", "stripeCustomerId"`,
        [safeAmount, user.id]
      );

      if (meta?.packageId) {
        const sessionKey = meta.checkoutSessionId || `${user.id}-${meta.paymentIntentId || "manual"}`;
        await client.query(
          `INSERT INTO "TokenPurchase" (id, "userId", "tokenPackageId", "stripeCheckoutSessionId",
             "stripePaymentIntentId", status, "tokensGranted", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, NOW(), NOW())
           ON CONFLICT ("stripeCheckoutSessionId") DO UPDATE SET
             status = 'CONFIRMED',
             "tokensGranted" = EXCLUDED."tokensGranted",
             "stripePaymentIntentId" = EXCLUDED."stripePaymentIntentId",
             "updatedAt" = NOW()`,
          [randomUUID(), user.id, meta.packageId, sessionKey, meta.paymentIntentId ?? null, safeAmount]
        );
      }

      await client.query("COMMIT");
      return updated[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
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
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Atomic spend guard: only deduct when tokenBalance >= required.
      const spendResult = await client.query(
        `UPDATE "User" SET "tokenBalance" = "tokenBalance" - $1, "updatedAt" = NOW()
         WHERE id = $2 AND "tokenBalance" >= $1`,
        [required, user.id]
      );

      if ((spendResult.rowCount ?? 0) === 0) {
        const { rows: latest } = await client.query<{ tokenBalance: number }>(
          `SELECT "tokenBalance" FROM "User" WHERE id = $1`,
          [user.id]
        );
        await client.query("COMMIT");
        return buildInsufficientResponse(latest[0]?.tokenBalance ?? 0);
      }

      const { rows: updated } = await client.query<{ tokenBalance: number }>(
        `SELECT "tokenBalance" FROM "User" WHERE id = $1`,
        [user.id]
      );

      await client.query(
        `INSERT INTO "TokenUsage" (id, "userId", endpoint, "charactersUsed", "tokensDeducted", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [randomUUID(), user.id, endpoint, required, required]
      );

      await client.query("COMMIT");
      return {
        ok: true as const,
        remainingBalance: updated[0]?.tokenBalance ?? 0,
        requiredTokens: required,
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch {
    throw new Error("Failed to consume tokens in database.");
  }
};

/**
 * Restores tokens after AI processing failed.
 * Returns true only when user balance increment was persisted.
 */
export const refundTokensAfterFailedProcessing = async (
  userId: string,
  amount: number,
  endpoint: string
): Promise<boolean> => {
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
      await pool.query(
        `UPDATE "User" SET "tokenBalance" = "tokenBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
        [refund, id]
      );

      try {
        await pool.query(
          `INSERT INTO "TokenUsage" (id, "userId", endpoint, "charactersUsed", "tokensDeducted", "createdAt")
           VALUES ($1, $2, $3, 0, $4, NOW())`,
          [randomUUID(), id, `${endpoint}#refund`, -refund]
        );
      } catch {
        console.error("[tokens] Refund audit logging failed", {
          userId: id,
          refund,
          endpoint,
        });
      }

      return true;
    } catch {
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: alreadyProcessed } = await client.query(
      `SELECT "eventId" FROM "ProcessedStripeEvent" WHERE "eventId" = $1`,
      [stripeEventId]
    );
    if (alreadyProcessed.length > 0) {
      await client.query("COMMIT");
      return { applied: false as const, reason: "duplicate_event" as const };
    }

    await client.query(
      `INSERT INTO "ProcessedStripeEvent" ("eventId", "createdAt") VALUES ($1, NOW())`,
      [stripeEventId]
    );

    const { rows: userRows } = await client.query<{ id: string; tokenBalance: number }>(
      `SELECT id, "tokenBalance" FROM "User" WHERE id = $1`,
      [normalizedUserId]
    );
    const user = userRows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return { applied: false as const, reason: "unknown_user" as const };
    }

    const { rows: existingPurchase } = await client.query<{ status: string }>(
      `SELECT status FROM "TokenPurchase" WHERE "stripeCheckoutSessionId" = $1`,
      [checkoutSessionId]
    );
    if (existingPurchase[0]?.status === "CONFIRMED") {
      await client.query("COMMIT");
      return { applied: false as const, reason: "purchase_already_confirmed" as const };
    }

    const { rows: updatedUser } = await client.query<{ tokenBalance: number }>(
      `UPDATE "User" SET "tokenBalance" = "tokenBalance" + $1, "updatedAt" = NOW()
       WHERE id = $2 RETURNING "tokenBalance"`,
      [tokenPackage.tokenAmount, user.id]
    );

    await client.query(
      `INSERT INTO "TokenPurchase" (id, "userId", "tokenPackageId", "stripeCheckoutSessionId",
         "stripePaymentIntentId", status, "tokensGranted", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, NOW(), NOW())
       ON CONFLICT ("stripeCheckoutSessionId") DO UPDATE SET
         status = 'CONFIRMED',
         "tokensGranted" = EXCLUDED."tokensGranted",
         "stripePaymentIntentId" = EXCLUDED."stripePaymentIntentId",
         "tokenPackageId" = EXCLUDED."tokenPackageId",
         "updatedAt" = NOW()`,
      [randomUUID(), user.id, tokenPackage.id, checkoutSessionId, paymentIntentId ?? null, tokenPackage.tokenAmount]
    );

    await client.query("COMMIT");
    return {
      applied: true as const,
      balance: updatedUser[0]?.tokenBalance,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const getPackageById = (packageId: string) =>
  TOKEN_PACKAGES.find((pkg) => pkg.id === packageId);

export const getPackageByStripePriceId = (stripePriceId: string) =>
  TOKEN_PACKAGES.find((pkg) => pkg.stripePriceId === stripePriceId);

export const getPackageForRequiredTokens = (requiredTokens: number) =>
  getRequiredPackage(requiredTokens);

// ─── Account lockout ──────────────────────────────────────────────────────────

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Records a failed login attempt for the given email.
 * Returns the updated loginAttempts count and whether the account is now locked.
 */
export const recordFailedLogin = async (
  email: string
): Promise<{ locked: boolean; lockedUntil: Date | null }> => {
  if (useMemoryStore) {
    return { locked: false, lockedUntil: null };
  }

  const normalizedEmail = normalizeEmail(email);
  try {
    const { rows } = await pool.query<{ loginAttempts: number; lockedUntil: Date | null }>(
      `UPDATE "User" SET "loginAttempts" = "loginAttempts" + 1, "updatedAt" = NOW()
       WHERE email = $1 RETURNING "loginAttempts", "lockedUntil"`,
      [normalizedEmail]
    );
    const updated = rows[0];
    if (!updated) return { locked: false, lockedUntil: null };

    if (updated.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await pool.query(
        `UPDATE "User" SET "lockedUntil" = $1, "updatedAt" = NOW() WHERE email = $2`,
        [lockedUntil, normalizedEmail]
      );
      return { locked: true, lockedUntil };
    }

    return { locked: false, lockedUntil: null };
  } catch {
    return { locked: false, lockedUntil: null };
  }
};

/**
 * Resets login attempt counter and clears any lockout on successful login.
 */
export const resetLoginAttempts = async (userId: string): Promise<void> => {
  if (useMemoryStore) return;

  const normalized = normalizeUserId(userId);
  try {
    await pool.query(
      `UPDATE "User" SET "loginAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = NOW()
       WHERE id = $1`,
      [normalized]
    );
  } catch {
    // Non-critical: failure here does not affect the user session.
  }
};

/**
 * Checks whether the account is currently locked.
 * Returns lockedUntil date if locked, null otherwise.
 */
export const checkAccountLockout = async (
  email: string
): Promise<Date | null> => {
  if (useMemoryStore) return null;

  const normalizedEmail = normalizeEmail(email);
  try {
    const { rows } = await pool.query<{ lockedUntil: Date | null }>(
      `SELECT "lockedUntil" FROM "User" WHERE email = $1`,
      [normalizedEmail]
    );
    const user = rows[0];
    if (!user?.lockedUntil) return null;

    if (user.lockedUntil <= new Date()) {
      // Lockout expired — clear it
      await pool.query(
        `UPDATE "User" SET "lockedUntil" = NULL, "loginAttempts" = 0, "updatedAt" = NOW()
         WHERE email = $1`,
        [normalizedEmail]
      );
      return null;
    }

    return user.lockedUntil;
  } catch {
    return null;
  }
};
