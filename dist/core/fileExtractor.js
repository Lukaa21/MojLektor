"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeExtractedText = exports.extractText = exports.validateExtension = exports.FileExtractionError = exports.MAX_UPLOAD_BYTES = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
exports.MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".docx"];
class FileExtractionError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "FileExtractionError";
    }
}
exports.FileExtractionError = FileExtractionError;
const validateExtension = (fileName) => {
    const ext = path_1.default.extname(fileName || "").toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
};
exports.validateExtension = validateExtension;
const extractText = async (filePath, fileName) => {
    const ext = path_1.default.extname(fileName || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new FileExtractionError("UNSUPPORTED_FILE_TYPE", "Dozvoljeni tipovi su .txt, .pdf, .docx");
    }
    const stats = await promises_1.default.stat(filePath);
    if (stats.size > exports.MAX_UPLOAD_BYTES) {
        throw new FileExtractionError("FILE_TOO_LARGE", "Fajl je prevelik. Maksimalna velicina je 10MB.");
    }
    const buffer = await promises_1.default.readFile(filePath);
    let raw = "";
    try {
        if (ext === ".txt") {
            raw = buffer.toString("utf-8");
        }
        else if (ext === ".pdf") {
            const parsed = await (0, pdf_parse_1.default)(buffer);
            raw = parsed.text || "";
        }
        else if (ext === ".docx") {
            const parsed = await mammoth_1.default.extractRawText({ buffer });
            raw = parsed.value || "";
        }
    }
    catch {
        throw new FileExtractionError("FILE_PARSE_ERROR", "Neuspjesno parsiranje fajla.");
    }
    const cleaned = (0, exports.sanitizeExtractedText)(raw);
    if (!cleaned) {
        throw new FileExtractionError("FILE_EMPTY_ERROR", "Fajl ne sadrzi tekstualni sadrzaj.");
    }
    return cleaned;
};
exports.extractText = extractText;
const sanitizeExtractedText = (input) => {
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
exports.sanitizeExtractedText = sanitizeExtractedText;
