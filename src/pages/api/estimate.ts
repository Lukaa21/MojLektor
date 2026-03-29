import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import { requireNextAuthUser } from "../../auth/guards";
import { Language, ServiceType } from "../../core/models";
import {
  extractText,
  FileExtractionError,
  validateExtension,
} from "../../core/fileExtractor";
import { getEstimateForTokens } from "../../tokens/service";
import { validateProcessInput } from "../../validation/processInput";
import { parseMultipart } from "../../utils/parseMultipart";
import { calculateTokenCost } from "../../core/tokenCost";
import { generalRateLimit } from "../../middleware/rateLimit";

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

  if (!(await generalRateLimit(req, res))) return;

  const user = await requireNextAuthUser(req, res);
  if (!user) return;

  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("multipart/form-data")) {
    let uploadedFile: formidable.File | null = null;
    try {
      const { fields, files } = await parseMultipart(req);
      const file = files.file;
      uploadedFile = Array.isArray(file) ? file[0] : (file ?? null);

      if (!uploadedFile || !uploadedFile.originalFilename) {
        return res.status(400).json({
          error: { code: "FILE_MISSING_ERROR", message: "Fajl je obavezan." },
        });
      }

      if (!validateExtension(uploadedFile.originalFilename)) {
        return res.status(400).json({
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
          error: {
            code: "BAD_REQUEST",
            message: "serviceType, textType i language su obavezni.",
          },
        });
      }

      const validation = validateProcessInput(serviceType, language, textType);
      if (!validation.ok) {
        return res.status(400).json({
          error: { code: "BAD_REQUEST", message: validation.error },
        });
      }

      const rawText = await extractText(
        uploadedFile.filepath,
        uploadedFile.originalFilename
      );

      if (rawText.length > MAX_INPUT_CHARS) {
        return res.status(400).json({
          error: {
            code: "INPUT_TOO_LARGE",
            message: `Input too large. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
          },
        });
      }

      const tokenCost = calculateTokenCost(rawText.length, serviceType);
      const estimate = await getEstimateForTokens(user.id, tokenCost);

      return res.status(200).json({
        rawText,
        requiredTokens: estimate.requiredTokens,
        currentBalance: estimate.currentBalance,
        canProcess: estimate.canProcess,
        suggestedPackage: estimate.suggestedPackage,
        recommendedPackagePrice: estimate.recommendedPackagePrice,
        nextLowerPackage: estimate.nextLowerPackage,
        differenceToLowerPackage: estimate.differenceToLowerPackage,
        serviceType,
        textType,
        language,
      });
    } catch (error) {
      if (error instanceof FileExtractionError) {
        const status = error.code === "FILE_PARSE_ERROR" ? 500 : 400;
        return res.status(status).json({
          error: { code: error.code, message: error.message },
        });
      }
      return res.status(500).json({
        error: {
          code: "UPLOAD_ERROR",
          message: "Doslo je do greske prilikom procjene fajla.",
        },
      });
    } finally {
      if (uploadedFile?.filepath) {
        await fs.unlink(uploadedFile.filepath).catch(() => undefined);
      }
    }
  }

  // JSON body path — bodyParser is disabled so we read and parse manually.
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBodyText = Buffer.concat(chunks).toString("utf-8");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBodyText) as Record<string, unknown>;
  } catch {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  const { rawText, serviceType, textType, language } = body as {
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

  const validation = validateProcessInput(serviceType, language, textType);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  if (rawText.length > MAX_INPUT_CHARS) {
    return res.status(400).json({
      error: `Input too large. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
    });
  }

  const tokenCost = calculateTokenCost(rawText.length, serviceType);
  const estimate = await getEstimateForTokens(user.id, tokenCost);

  return res.status(200).json({
    requiredTokens: estimate.requiredTokens,
    currentBalance: estimate.currentBalance,
    canProcess: estimate.canProcess,
    suggestedPackage: estimate.suggestedPackage,
    recommendedPackagePrice: estimate.recommendedPackagePrice,
    nextLowerPackage: estimate.nextLowerPackage,
    differenceToLowerPackage: estimate.differenceToLowerPackage,
    serviceType,
    textType,
    language,
  });
}
