import { httpServer } from "./app.js";
import { connectDB } from "./config/db.js";
import config from "./config/config.js";

// 1️⃣ Configuration & Environment Setup
const PORT = config.port || 8000;

// 2️⃣ Database Connection
connectDB();

// 3️⃣ Start HTTP & Socket.IO Server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
