import { Router } from "express";
import {
  createMeal,
  getAllMeals,
  getMealById,
  updateMeal,
  deleteMeal,
} from "../controllers/meals.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";

const mealRouter = Router();

// 1️⃣ Public Routes
/**
 * @openapi
 * /api/meals:
 *   get:
 *     summary: Get all meals with optional pagination, search, and category filter (Public)
 *     tags: [Meals]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of meals per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword to filter meals by name
 *     responses:
 *       200:
 *         description: List of meals with pagination metadata retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
mealRouter.get("/", getAllMeals);

/**
 * @openapi
 * /api/meals/{id}:
 *   get:
 *     summary: Get a single meal by ID (Public)
 *     tags: [Meals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     responses:
 *       200:
 *         description: Meal details retrieved successfully
 *       404:
 *         description: Meal not found
 */
mealRouter.get("/:id", getMealById);

// 2️⃣ Admin Only Routes
/**
 * @openapi
 * /api/meals:
 *   post:
 *     summary: Create a new meal (Admin only)
 *     tags: [Meals]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, category]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cheeseburger
 *               description:
 *                 type: string
 *                 example: Juicy beef patty with cheddar cheese and fresh lettuce
 *               price:
 *                 type: number
 *                 example: 12.99
 *               category:
 *                 type: string
 *                 description: Category ObjectId
 *                 example: 60d5ecb8b5c9c22b4c8e4111
 *               image:
 *                 type: string
 *                 example: https://example.com/images/cheeseburger.jpg
 *               isAvailable:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Meal created successfully
 *       400:
 *         description: Meal name already exists, category does not exist, or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 */
mealRouter.post("/", isVerifiedUser, isAdmin, createMeal);

/**
 * @openapi
 * /api/meals/{id}:
 *   put:
 *     summary: Update an existing meal (Admin only)
 *     tags: [Meals]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Meal updated successfully
 *       400:
 *         description: Category does not exist or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 *       404:
 *         description: Meal not found
 */
mealRouter.put("/:id", isVerifiedUser, isAdmin, updateMeal);

/**
 * @openapi
 * /api/meals/{id}:
 *   delete:
 *     summary: Delete a meal by ID (Admin only)
 *     tags: [Meals]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     responses:
 *       200:
 *         description: Meal deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 *       404:
 *         description: Meal not found
 */
mealRouter.delete("/:id", isVerifiedUser, isAdmin, deleteMeal);

export default mealRouter;
