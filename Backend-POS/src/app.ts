import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { connectDB } from "./config/db.js";
import config from "./config/config.js";
import globalErrorHandling from "./middlewares/globalErrorHandler.js";
import userRouter from "./routes/users.route.js";
import orderRouter from "./routes/orders.route.js";
import mealRouter from "./routes/meals.route.js";
import tableRouter from "./routes/tables.route.js";
import categoryRouter from "./routes/categories.route.js";
import cookieParser from "cookie-parser";
import { socketAuthMiddleware } from "./middlewares/socketAuth.js";

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: config.frontendUrl, credentials: true },
});

const PORT = config.port || 8000;

connectDB();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/meals", mealRouter);
app.use("/api/tables", tableRouter);
app.use("/api/categories", categoryRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

app.use(globalErrorHandling);

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export { io };
