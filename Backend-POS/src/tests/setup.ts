import mongoose from "mongoose";
import { beforeAll, afterEach, afterAll } from "@jest/globals";
import dotenv from "dotenv";

// Load environment variables for the test environment
dotenv.config();

const TEST_DB_NAME = "pos-test";

// 1️⃣ Connect to Test Database Before Running Tests
beforeAll(async () => {
  const baseUri = process.env.MONGODB_URI || "";

  // Safely parse URI to append test database name without breaking query params
  const [beforeQuery, query] = baseUri.split("?");
  const cleanBase = beforeQuery?.replace(/\/$/, "");

  const testUri = query
    ? `${cleanBase}/${TEST_DB_NAME}?${query}`
    : `${cleanBase}/${TEST_DB_NAME}`;

  // Log masked connection URI for debugging
  console.log("Connecting to test DB:", testUri.replace(/:[^:@]+@/, ":****@"));

  await mongoose.connect(testUri);
}, 30000);

// 2️⃣ Clean Up All Collections After Each Test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]?.deleteMany({});
  }
});

// 3️⃣ Disconnect Mongoose After All Tests Complete
afterAll(async () => {
  await mongoose.connection.close();
});
