import mongoose from "mongoose";
import { beforeAll, afterEach, afterAll } from "@jest/globals";
import dotenv from "dotenv";
dotenv.config();

const TEST_DB_NAME = "pos-test";

beforeAll(async () => {
  const baseUri = process.env.MONGODB_URI || "";
  const [beforeQuery, query] = baseUri.split("?");
  const cleanBase = beforeQuery?.replace(/\/$/, "");

  const testUri = query
    ? `${cleanBase}/${TEST_DB_NAME}?${query}`
    : `${cleanBase}/${TEST_DB_NAME}`;

  console.log("Connecting to test DB:", testUri.replace(/:[^:@]+@/, ":****@"));

  await mongoose.connect(testUri);
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]?.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});