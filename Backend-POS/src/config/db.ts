import dns from "dns";
// 1️⃣ Override DNS servers to prevent Atlas lookup timeouts on local networks
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import config from "./config.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// 2️⃣ Database Connection with Retry Mechanism
export const connectDB = async (retries = MAX_RETRIES): Promise<void> => {
  try {
    mongoose.set("strictQuery", false);

    const conn = await mongoose.connect(config.databaseURI || "", {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Database connection failed: ${err.message}`);

    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }

    console.error("❌ All connection attempts failed. Exiting.");
    process.exit(1);
  }
};
