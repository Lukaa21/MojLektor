"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultipart = void 0;
const formidable_1 = __importDefault(require("formidable"));
const fileExtractor_1 = require("../core/fileExtractor");
const parseMultipart = (req) => new Promise((resolve, reject) => {
    const form = (0, formidable_1.default)({ multiples: false, maxFileSize: fileExtractor_1.MAX_UPLOAD_BYTES });
    form.parse(req, (err, fields, files) => {
        if (err) {
            reject(err);
            return;
        }
        resolve({ fields, files });
    });
});
exports.parseMultipart = parseMultipart;
