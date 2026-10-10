import express from "express";
import {
  login,
  logout,
  register,
  createStaff,
  getProfile,
} from "../controllers/users.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";

const userRouter = express.Router();

// 1️⃣ Auth Routes
/**
 * @openapi
 * /api/users/register:
 *   post:
 *     summary: Register a new customer account (Public) - always created with the Customer role
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+201000000000"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StrongP@ss123"
 *               age:
 *                 type: integer
 *                 example: 25
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or validation error
 */
userRouter.post("/register", register);

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     summary: User login & JWT cookie issuance (Public)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StrongP@ss123"
 *     responses:
 *       200:
 *         description: User logged in successfully (HTTP-only accessToken cookie set)
 *       401:
 *         description: Invalid Email or Password
 */
userRouter.post("/login", login);

/**
 * @openapi
 * /api/users/logout:
 *   post:
 *     summary: Log out - clears the HTTP-only accessToken cookie (Public, idempotent)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
userRouter.post("/logout", logout);

// 2️⃣ Protected Routes
/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
userRouter.get("/profile", isVerifiedUser, getProfile);

// 3️⃣ Admin Only Routes
/**
 * @openapi
 * /api/users/staff:
 *   post:
 *     summary: Create a staff account - Admin or Cashier (Admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sara Cashier
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sara@restaurant.com
 *               phone:
 *                 type: string
 *                 example: "+201000000001"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StrongP@ss123"
 *               role:
 *                 type: string
 *                 enum: [Admin, Cashier]
 *                 example: Cashier
 *     responses:
 *       201:
 *         description: Staff account created successfully
 *       400:
 *         description: User already exists or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 *       409:
 *         description: Phone number already in use
 */
userRouter.post("/staff", isVerifiedUser, isAdmin, createStaff);

export default userRouter;
