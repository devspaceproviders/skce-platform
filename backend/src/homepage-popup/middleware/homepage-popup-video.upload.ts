import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "homepage-popup"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (
    _req,
    _file,
    cb
  ) => {
    cb(null, uploadDirectory);
  },

  filename: (
    _req,
    file,
    cb
  ) => {
    const extension = path.extname(
      file.originalname
    );

    const baseName =
      path
        .basename(
          file.originalname,
          extension
        )
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        ) || "homepage-popup-video";

    cb(
      null,
      `homepage-popup-${Date.now()}-${Math.round(
        Math.random() * 1000000
      )}-${baseName}${extension.toLowerCase()}`
    );
  },
});

const allowedMimeTypes = new Set([
  "video/mp4",
  "video/webm",
]);

const allowedExtensions = new Set([
  ".mp4",
  ".webm",
]);

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (
    !allowedMimeTypes.has(file.mimetype) ||
    !allowedExtensions.has(extension)
  ) {
    cb(
      new Error(
        "Only MP4 and WEBM video files are allowed."
      )
    );

    return;
  }

  cb(null, true);
};

const homepagePopupVideoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export default homepagePopupVideoUpload;