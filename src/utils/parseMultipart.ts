import { IncomingMessage } from "http";
import formidable from "formidable";
import { MAX_UPLOAD_BYTES } from "../core/fileExtractor";

export const parseMultipart = (req: IncomingMessage) =>
  new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      const form = formidable({ multiples: false, maxFileSize: MAX_UPLOAD_BYTES });
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    }
  );
