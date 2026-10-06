require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing.");
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required."
  );
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    isActive: Boolean,
  },
  {
    collection: "users",
  }
);

async function createSuperAdmin() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected.");

    const User =
      mongoose.models.User ||
      mongoose.model("User", userSchema);

    const email = ADMIN_EMAIL.toLowerCase().trim();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("A user with this email already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      name: "Restova Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    });

    console.log("");
    console.log("Super Admin created successfully.");
    console.log("Email:", email);
    console.log("Role: SUPER_ADMIN");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("Failed to create Super Admin.");
    console.error(error);
    console.error("");
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createSuperAdmin();