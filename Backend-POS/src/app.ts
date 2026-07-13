import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

connectDB();

app.use(express.json());

app.use((req: Request, res: Response) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
