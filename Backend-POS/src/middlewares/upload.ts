import multer from "multer";

// Memory storage: the file is held as a Buffer in req.file.buffer and
// streamed straight to Cloudinary - never written to local disk. This
// matters specifically because Railway's filesystem is ephemeral; disk
// storage would appear to work locally and then silently lose every
// uploaded file on the next deploy.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const error: any = new Error(
        "Only JPEG, PNG, or WEBP images are allowed",
      );
      error.statusCode = 400;
      cb(error);
      return;
    }
    cb(null, true);
  },
});
