
import "dotenv/config";
import mongoose from "mongoose";

async function testMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    const result = await mongoose.connection.db.admin().ping();

    console.log("MongoDB connection successful!");
    console.log("Ping result:", result);

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

await testMongoDB();
