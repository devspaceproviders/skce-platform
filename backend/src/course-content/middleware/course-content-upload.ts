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

const imageDirectory = path.join(
  courseContentDirectory,
  "images"
);

fs.mkdirSync(videoDirectory, {
  recursive: true,
});

fs.mkdirSync(documentDirectory, {
  recursive: true,
});

fs.mkdirSync(imageDirectory, {
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
      path.extname(file.originalname).toLowerCase();

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
      path.extname(file.originalname).toLowerCase();

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

/* =========================================================
   IMAGE CONFIGURATION
========================================================= */

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const imageFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  if (!allowedImageMimeTypes.has(file.mimetype)) {
    cb(
      new Error(
        "Only JPG, PNG, and WEBP images are allowed."
      )
    );
    return;
  }

  cb(null, true);
};

/* =========================================================
   LESSON IMAGE UPLOAD
   Temporary - kept until Lesson.imageUrl is removed
========================================================= */

const lessonImageStorage = multer.diskStorage({
  destination: (
    _req,
    _file,
    cb
  ) => {
    cb(null, imageDirectory);
  },

  filename: (
    _req,
    file,
    cb
  ) => {
    const extension =
      path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `lesson-${Date.now()}-${Math.round(
        Math.random() * 1_000_000_000
      )}${extension}`;

    cb(null, uniqueName);
  },
});

export const lessonImageUpload = multer({
  storage: lessonImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* =========================================================
   MODULE IMAGE UPLOAD
========================================================= */

const moduleImageStorage = multer.diskStorage({
  destination: (
    _req,
    _file,
    cb
  ) => {
    cb(null, imageDirectory);
  },

  filename: (
    _req,
    file,
    cb
  ) => {
    const extension =
      path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `module-${Date.now()}-${Math.round(
        Math.random() * 1_000_000_000
      )}${extension}`;

    cb(null, uniqueName);
  },
});

export const moduleImageUpload = multer({
  storage: moduleImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});