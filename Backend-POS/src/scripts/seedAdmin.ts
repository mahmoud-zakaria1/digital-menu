import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/user.schema.js";
import { createStaffValidate } from "../validators/user.validator.js";
import { formatZodError } from "../utils/formatZodError.js";

// Bootstraps the very first Admin. It has to exist outside the HTTP API:
// public register can't assign roles and POST /api/users/staff needs an
// existing Admin, so there is no in-app path to the first one - and any
// in-app path would be one an attacker could use too.
//
//   npm run seed:admin
//
// Reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PHONE / ADMIN_PASSWORD from the
// environment (.env locally). Safe to run more than once: it does nothing
// if an Admin already exists.

const REQUIRED_VARS = [
  "ADMIN_NAME",
  "ADMIN_EMAIL",
  "ADMIN_PHONE",
  "ADMIN_PASSWORD",
] as const;

const run = async (): Promise<void> => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Same rules as the Admin-only staff endpoint, so a seeded account
  // can't be weaker than one created through the dashboard.
  const parsed = createStaffValidate.safeParse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    phone: process.env.ADMIN_PHONE,
    password: process.env.ADMIN_PASSWORD,
    role: "Admin",
  });

  if (!parsed.success) {
    console.error("❌ Invalid ADMIN_* values:");
    for (const issue of formatZodError(parsed.error)) {
      console.error(`   - ${issue.field}: ${issue.message}`);
    }
    process.exit(1);
  }

  const data = parsed.data;
  // The User schema lowercases emails on save, so compare the same way.
  const email = data.email.toLowerCase();

  await connectDB();

  try {
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log(
        `✅ An Admin already exists (${existingAdmin.email}) - nothing to do.`,
      );
      return;
    }

    // Refuse rather than silently promote: an email that is already
    // registered as a Customer belongs to somebody, and turning it into
    // an Admin should be a deliberate manual decision, not a side effect.
    const emailTaken = await User.findOne({ email });
    if (emailTaken) {
      console.error(
        `❌ ${email} is already registered as a ${emailTaken.role}. ` +
          "Use a different ADMIN_EMAIL, or change that account's role manually.",
      );
      process.exitCode = 1;
      return;
    }

    // save() (not insertMany/create-lean) so the pre('save') hook hashes
    // the password. The password is never logged.
    const admin = new User({ ...data, email, role: "Admin" });
    await admin.save();

    console.log(`✅ Admin account created: ${admin.email}`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
