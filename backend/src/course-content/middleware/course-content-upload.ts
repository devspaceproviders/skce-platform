import multer from "multer";
import path from "path";
import fs from "fs";

/* =========================================================
   UPLOAD DIRECTORIES
========================================================= */

const courseContentDirectory = path.join(
  process.cwd(),
  "uploads",
  "course-content"
);

const videoDirectory = path.join(
  courseContentDirectory,
  "videos"
);

const documentDirectory = path.join(
  courseContentDirectory,
  "documents"
);

fs.mkdirSync(videoDirectory, {
  recursive: true,
});

fs.mkdirSync(documentDirectory, {
  recursive: true,
});

/* =========================================================
   VIDEO UPLOAD
========================================================= */

const videoStorage = multer.diskStorage({
  destination: (
    _req,
    _file,
    cb
  ) => {
    cb(null, videoDirectory);
  },

  filename: (
    _req,
    file,
    cb
  ) => {
    const extension =
      path.extname(file.originalname)
        .toLowerCase();

    const uniqueName =
      `video-${Date.now()}-${Math.round(
        Math.random() * 1_000_000_000
      )}${extension}`;

    cb(null, uniqueName);
  },
});

const allowedVideoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const videoFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  if (!allowedVideoMimeTypes.has(file.mimetype)) {
    cb(
      new Error(
        "Only MP4, WebM, and MOV video files are allowed."
      )
    );
    return;
  }

  cb(null, true);
};

export const courseVideoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

/* =========================================================
   DOCUMENT UPLOAD
========================================================= */

const documentStorage = multer.diskStorage({
  destination: (
    _req,
    _file,
    cb
  ) => {
    cb(null, documentDirectory);
  },

  filename: (
    _req,
    file,
    cb
  ) => {
    const extension =
      path.extname(file.originalname)
        .toLowerCase();

    const uniqueName =
      `document-${Date.now()}-${Math.round(
        Math.random() * 1_000_000_000
      )}${extension}`;

    cb(null, uniqueName);
  },
});

const allowedDocumentMimeTypes = new Set([
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const documentFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  if (!allowedDocumentMimeTypes.has(file.mimetype)) {
    cb(
      new Error(
        "Only PDF, DOC, DOCX, PPT, and PPTX documents are allowed."
      )
    );
    return;
  }

  cb(null, true);
};

export const courseDocumentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});