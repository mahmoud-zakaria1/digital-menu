import { httpServer } from "./app.js";
import { connectDB } from "./config/db.js";
import config from "./config/config.js";

const PORT = config.port || 8000;

connectDB();

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
