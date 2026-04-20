import mongoose from "mongoose";

export async function connectDB(uri: string) {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err: any) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}
