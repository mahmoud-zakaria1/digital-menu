import express from 'express';
import { register } from "../controllers/users.controller.js";

const route = express.Router();

// Register API
route.post("/register", register );


export default route;