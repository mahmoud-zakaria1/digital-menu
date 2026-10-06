import { Router } from "express";
import { uploadMealImage } from "../controllers/uploads.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";
import { uploadImage } from "../middlewares/upload.js";

const uploadRouter = Router();

/**
 * @openapi
 * /api/uploads/meal-image:
 *   post:
 *     summary: Upload a meal image to Cloudinary (Admin only)
 *     tags: [Uploads]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully, returns the Cloudinary URL
 *       400:
 *         description: No file provided, or file type/size rejected
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 */
uploadRouter.post(
  "/meal-image",
  isVerifiedUser,
  isAdmin,
  uploadImage.single("image"),
  uploadMealImage,
);

export default uploadRouter;
