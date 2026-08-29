import express from "express";
import {
  login,
  register,
  getProfile,
} from "../controllers/users.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const userRouter = express.Router();

// 1️⃣ Auth Routes
/**
 * @openapi
 * /api/users/register:
 *   post:
 *     summary: Register a new user account (Public)
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
 *               role:
 *                 type: string
 *                 enum: [Admin, Cashier, Customer]
 *                 default: Customer
 *                 example: Customer
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

export default userRouter;
