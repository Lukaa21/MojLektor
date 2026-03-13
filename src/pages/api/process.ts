import type { NextApiRequest, NextApiResponse } from "next";
import { requireNextAuthUser } from "../../auth/guards";
import { processText } from "../../ai/processText";
import { createFullDiff } from "../../core/diff";
import { JobStatus, Language, ServiceType } from "../../core/models";
import { consumeTokensForProcessing } from "../../tokens/service";
import { processRateLimit } from "../../middleware/rateLimit";

const MAX_INPUT_CHARS = 100_000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await processRateLimit(req, res))) return;

  const { rawText, serviceType, textType, language } = req.body as {
    rawText?: string;
    serviceType?: ServiceType;
    textType?: string;
    language?: Language;
  };

  if (!rawText || !serviceType || !textType || !language) {
    return res.status(400).json({
      error: "rawText, serviceType, textType, and language are required",
    });
  }

  if (rawText.length > MAX_INPUT_CHARS) {
    return res.status(400).json({
      error: `Input too large. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
    });
  }

  if (!Object.values(ServiceType).includes(serviceType)) {
    return res.status(400).json({ error: "Invalid serviceType" });
  }

  const allowedLanguages: Language[] = [
    "crnogorski",
    "srpski",
    "hrvatski",
    "bosanski",
  ];

  if (!allowedLanguages.includes(language)) {
    return res.status(400).json({ error: "Invalid language" });
  }

  const user = await requireNextAuthUser(req, res);
  if (!user) {
    return;
  }

  const tokenCheck = await consumeTokensForProcessing(
    user.id,
    rawText.length,
    "/api/process"
  );

  if (!tokenCheck.ok) {
    return res.status(402).json({
      error: {
        code: "INSUFFICIENT_TOKENS",
        message: "Nedovoljno tokena za obradu teksta.",
      },
      requiredTokens: tokenCheck.requiredTokens,
      currentBalance: tokenCheck.currentBalance,
      shortfall: tokenCheck.shortfall,
      suggestedPackage: tokenCheck.suggestedPackage,
      nextLowerPackage: tokenCheck.nextLowerPackage,
      differenceToLowerPackage: tokenCheck.differenceToLowerPackage,
      redirectPath: "/buy-tokens",
    });
  }

  try {
    const { edited: processedText, cardCount } = await processText(
      rawText,
      serviceType,
      textType,
      language
    );

    const fullDiff = createFullDiff(rawText, processedText);

    return res.json({
      success: true,
      original: fullDiff.original,
      edited: fullDiff.edited,
      diff: fullDiff.diff,
      changes: fullDiff.changes,
      tokens: fullDiff.tokens,
      cardCount,
      remainingBalance: tokenCheck.remainingBalance,
      status: JobStatus.DONE,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: "LLM_ERROR",
        message: "Doslo je do greske prilikom AI obrade.",
      },
    });
  }
}
