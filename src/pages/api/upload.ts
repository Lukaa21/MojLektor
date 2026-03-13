import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import { requireNextAuthUser } from "../../auth/guards";
import { processText } from "../../ai/processText";
import { createFullDiff } from "../../core/diff";
import {
  extractText,
  FileExtractionError,
  validateExtension,
} from "../../core/fileExtractor";
import { JobStatus, Language, ServiceType } from "../../core/models";
import {
  consumeTokensForProcessing,
} from "../../tokens/service";
import { processRateLimit } from "../../middleware/rateLimit";
import { validateProcessInput } from "../../validation/processInput";
import { parseMultipart } from "../../utils/parseMultipart";
import { calculateTokenCost } from "../../core/tokenCost";

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_INPUT_CHARS = 100_000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await processRateLimit(req, res))) return;

  let uploadedFile: formidable.File | null = null;
  const user = await requireNextAuthUser(req, res);
  if (!user) {
    return;
  }

  try {
    const { fields, files } = await parseMultipart(req);

    const file = files.file;
    uploadedFile = Array.isArray(file) ? file[0] : file ?? null;

    if (!uploadedFile || !uploadedFile.originalFilename) {
      return res.status(400).json({
        success: false,
        error: {
          code: "FILE_MISSING_ERROR",
          message: "Fajl je obavezan.",
        },
      });
    }

    if (!validateExtension(uploadedFile.originalFilename)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "UNSUPPORTED_FILE_TYPE",
          message: "Dozvoljeni tipovi su .txt, .pdf, .docx",
        },
      });
    }

    const serviceTypeRaw = Array.isArray(fields.serviceType)
      ? fields.serviceType[0]
      : fields.serviceType;
    const textTypeRaw = Array.isArray(fields.textType)
      ? fields.textType[0]
      : fields.textType;
    const languageRaw = Array.isArray(fields.language)
      ? fields.language[0]
      : fields.language;

    const serviceType = serviceTypeRaw as ServiceType | undefined;
    const textType = textTypeRaw as string | undefined;
    const language = languageRaw as Language | undefined;

    if (!serviceType || !textType || !language) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "serviceType, textType i language su obavezni.",
        },
      });
    }

    const validation = validateProcessInput(serviceType, language);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: validation.error },
      });
    }

    const original = await extractText(
      uploadedFile.filepath,
      uploadedFile.originalFilename
    );

    if (original.length > MAX_INPUT_CHARS) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INPUT_TOO_LARGE",
          message: `Input too large. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
        },
      });
    }

    let edited: string;
    let cardCount: number;
    try {
      const result = await processText(
        original,
        serviceType,
        textType,
        language
      );
      edited = result.edited;
      cardCount = result.cardCount;
    } catch (aiError) {
      return res.status(500).json({
        success: false,
        error: {
          code: "LLM_ERROR",
          message: "Doslo je do greske prilikom AI obrade.",
        },
      });
    }

    const tokenCheck = await consumeTokensForProcessing(
      user.id,
      calculateTokenCost(original.length, serviceType),
      "/api/upload"
    );

    if (!tokenCheck.ok) {
      return res.status(402).json({
        success: false,
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

    const fullDiff = createFullDiff(original, edited);

    return res.status(200).json({
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
  } catch (error) {
    if (error instanceof FileExtractionError) {
      const status =
        error.code === "FILE_PARSE_ERROR" ? 500 : 400;
      return res.status(status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: "Doslo je do greske prilikom obrade fajla.",
      },
    });
  } finally {
    if (uploadedFile?.filepath) {
      await fs.unlink(uploadedFile.filepath).catch(() => undefined);
    }
  }
}
