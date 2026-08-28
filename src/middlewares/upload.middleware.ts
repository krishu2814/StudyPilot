import multer from "multer";
import path from "path";
import { Request } from "express";

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Invalid file type '${ext}'. Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed.`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});
