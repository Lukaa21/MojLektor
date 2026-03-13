import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".docx"];

export type FileExtractionErrorCode =
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "FILE_EMPTY_ERROR"
  | "FILE_PARSE_ERROR";

export class FileExtractionError extends Error {
  constructor(public code: FileExtractionErrorCode, message: string) {
    super(message);
    this.name = "FileExtractionError";
  }
}

export const validateExtension = (fileName: string) => {
  const ext = path.extname(fileName || "").toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
};

export const extractText = async (filePath: string, fileName: string) => {
  const ext = path.extname(fileName || "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new FileExtractionError(
      "UNSUPPORTED_FILE_TYPE",
      "Dozvoljeni tipovi su .txt, .pdf, .docx"
    );
  }

  const stats = await fs.stat(filePath);
  if (stats.size > MAX_UPLOAD_BYTES) {
    throw new FileExtractionError(
      "FILE_TOO_LARGE",
      "Fajl je prevelik. Maksimalna velicina je 10MB."
    );
  }

  const buffer = await fs.readFile(filePath);

  let raw = "";
  try {
    if (ext === ".txt") {
      raw = buffer.toString("utf-8");
    } else if (ext === ".pdf") {
      const parsed = await pdfParse(buffer);
      raw = parsed.text || "";
    } else if (ext === ".docx") {
      const parsed = await mammoth.extractRawText({ buffer });
      raw = parsed.value || "";
    }
  } catch {
    throw new FileExtractionError(
      "FILE_PARSE_ERROR",
      "Neuspjesno parsiranje fajla."
    );
  }

  const cleaned = sanitizeExtractedText(raw);
  if (!cleaned) {
    throw new FileExtractionError(
      "FILE_EMPTY_ERROR",
      "Fajl ne sadrzi tekstualni sadrzaj."
    );
  }

  return cleaned;
};

export const sanitizeExtractedText = (input: string) => {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
