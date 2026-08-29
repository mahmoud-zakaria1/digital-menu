import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";

const categoryRouter = Router();

// 1️⃣ Public Routes
/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Get all categories (Public)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: isActiveOnly
 *         schema:
 *           type: boolean
 *         description: Optional filter to retrieve only active categories (e.g. ?isActiveOnly=true)
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 */
categoryRouter.get("/", getAllCategories);

// 2️⃣ Admin Only Routes
/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Beverages
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Category name already exists or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 */
categoryRouter.post("/", isVerifiedUser, isAdmin, createCategory);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     summary: Update an existing category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 *       404:
 *         description: Category not found
 */
categoryRouter.put("/:id", isVerifiedUser, isAdmin, updateCategory);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category because it is assigned to existing meals
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 *       404:
 *         description: Category not found
 */
categoryRouter.delete("/:id", isVerifiedUser, isAdmin, deleteCategory);

export default categoryRouter;
