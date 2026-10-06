import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";

// Wraps Cloudinary's upload_stream (callback-based) in a Promise so it
// can be awaited like the rest of the codebase's async controllers.
const streamUpload = (buffer: Buffer): Promise<{ secure_url: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "digital-menu/meals" },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
};

// 1️⃣ Upload a Meal Image (Admin only - gated at the route level)
export const uploadMealImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      const error: any = new Error("No image file provided");
      error.statusCode = 400;
      return next(error);
    }

    const result = await streamUpload(req.file.buffer);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: { url: result.secure_url },
    });
  } catch (error) {
    next(error);
  }
};
