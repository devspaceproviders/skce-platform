import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads", "assignments");
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".zip", ".ppt", ".pptx",
  ".xls", ".xlsx", ".txt", ".jpg", ".jpeg", ".png",
]);

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
]);

function ensureUploadDirectory() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

function validateAssignmentFile(file: Express.Multer.File) {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error("Invalid assignment file");
  }

  if (file.size <= 0 || file.buffer.length <= 0) {
    throw new Error("Uploaded assignment file is empty");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Assignment file must be 10 MB or smaller");
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(
      "File type is not allowed. Allowed files: PDF, DOC, DOCX, ZIP, PPT, PPTX, XLS, XLSX, TXT, JPG, JPEG and PNG."
    );
  }

  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error("Uploaded file MIME type is not allowed");
  }

  return extension;
}

const memoryStorage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) {
  try {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return callback(new Error("File type is not allowed"));
    }

    if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(new Error("Uploaded file MIME type is not allowed"));
    }

    callback(null, true);
  } catch (error) {
    callback(error instanceof Error ? error : new Error("Invalid uploaded file"));
  }
}

export const uploadAssignmentFile = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

export async function saveAssignmentSubmissionFile(
  submissionId: number,
  file: Express.Multer.File
) {
  const extension = validateAssignmentFile(file);
  ensureUploadDirectory();

  const storedFileName = `${submissionId}-${crypto.randomUUID()}${extension}`;
  const absolutePath = path.join(UPLOAD_ROOT, storedFileName);

  await fs.promises.writeFile(absolutePath, file.buffer);

  return {
    storedFileName,
    downloadUrl: `/api/assessments/submissions/${submissionId}/file/${encodeURIComponent(storedFileName)}`,
  };
}

export async function resolveAssignmentSubmissionFile(fileKey: string) {
  const decoded = decodeURIComponent(String(fileKey || ""));
  const safeFileName = path.basename(decoded);

  if (!safeFileName || safeFileName !== decoded) {
    throw new Error("Submission file not found");
  }

  const absolutePath = path.resolve(UPLOAD_ROOT, safeFileName);
  const rootPath = path.resolve(UPLOAD_ROOT);

  if (absolutePath !== rootPath && !absolutePath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("Submission file not found");
  }

  try {
    const stats = await fs.promises.stat(absolutePath);
    if (!stats.isFile()) {
      throw new Error("Submission file not found");
    }
  } catch {
    throw new Error("Submission file not found");
  }

  return absolutePath;
}

export async function deleteAssignmentSubmissionFile(
  storedFileName: string | null | undefined
) {
  if (!storedFileName) return;

  const decoded = decodeURIComponent(String(storedFileName));
  const safeFileName = path.basename(decoded);

  if (!safeFileName || safeFileName !== decoded) return;

  const absolutePath = path.resolve(UPLOAD_ROOT, safeFileName);
  const rootPath = path.resolve(UPLOAD_ROOT);

  if (absolutePath !== rootPath && !absolutePath.startsWith(`${rootPath}${path.sep}`)) {
    return;
  }

  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return;
    }

    console.error("Unable to delete assignment submission file:", error);
  }
}
