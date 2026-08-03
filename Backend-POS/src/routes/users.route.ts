import express from "express";
import { login, register, getProfile } from "../controllers/users.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const userRouter = express.Router();

// Register API
userRouter.post("/register", register);
// Login API
userRouter.post("/login", login);
// Profile API
userRouter.get("/profile", isVerifiedUser, getProfile);

export default userRouter;
