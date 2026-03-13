import { Request, Response } from "express";
import formidable from "formidable";
import fs from "fs/promises";
import { requireExpressAuthUser } from "../auth/guards";
import { Language, ServiceType } from "../core/models";
import {
  extractText,
  FileExtractionError,
  validateExtension,
} from "../core/fileExtractor";
import {
  getEstimateForTokens,
} from "../tokens/service";
import { validateProcessInput } from "../validation/processInput";
import { parseMultipart } from "../utils/parseMultipart";

type EstimateInput = {
  rawText: string;
  serviceType: ServiceType;
  textType: string;
  language: Language;
  userId: string;
};

export const calculateEstimate = ({
  rawText,
  serviceType,
  textType,
  language,
  userId,
}: EstimateInput) => {
  if (!rawText || !serviceType || !textType || !language) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: "rawText, serviceType, textType, and language are required",
      },
    };
  }

  const validation = validateProcessInput(serviceType, language);
  if (!validation.ok) {
    return {
      ok: false as const,
      status: 400,
      body: { error: validation.error },
    };
  }

  return getEstimateForTokens(userId, rawText.length).then((estimate) => ({
    ok: true as const,
    status: 200,
    body: {
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
    },
  }));
};

export const estimateHandler = async (req: Request, res: Response) => {
  const user = await requireExpressAuthUser(req, res);
  if (!user) {
    return;
  }

  const userId = user.id;
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("multipart/form-data")) {
    let uploadedFile: formidable.File | null = null;
    try {
      const { fields, files } = await parseMultipart(req);
      const file = files.file;
      uploadedFile = Array.isArray(file) ? file[0] : file ?? null;

      if (!uploadedFile || !uploadedFile.originalFilename) {
        return res.status(400).json({
          error: {
            code: "FILE_MISSING_ERROR",
            message: "Fajl je obavezan.",
          },
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

      const rawText = await extractText(
        uploadedFile.filepath,
        uploadedFile.originalFilename
      );

      const result = await calculateEstimate({
        rawText,
        serviceType: serviceTypeRaw as ServiceType,
        textType: (textTypeRaw as string) || "",
        language: languageRaw as Language,
        userId,
      });

      return res.status(result.status).json(result.body);
    } catch (error) {
      if (error instanceof FileExtractionError) {
        const status =
          error.code === "FILE_PARSE_ERROR" ? 500 : 400;
        return res.status(status).json({
          error: {
            code: error.code,
            message: error.message,
          },
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

  const { rawText, serviceType, textType, language } = req.body as {
    rawText?: string;
    serviceType?: ServiceType;
    textType?: string;
    language?: Language;
  };

  const result = await calculateEstimate({
    rawText: rawText || "",
    serviceType: serviceType as ServiceType,
    textType: textType || "",
    language: language as Language,
    userId,
  });

  return res.status(result.status).json(result.body);
};
