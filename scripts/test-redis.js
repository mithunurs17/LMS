
import "dotenv/config";
import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL,
  socket: { connectTimeout: 5000 },
});

async function testRedis() {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL is missing");
    }

    client.on("error", (err) => {
      console.error("Redis client error:", err.message);
    });

    await client.connect();

    console.log("Redis ping:", await client.ping());

    const key = "lms:phase1:connection-test";
    await client.set(key, "connected", { EX: 30 });

    console.log("Redis read/write:", await client.get(key));

    await client.del(key);
    console.log("Redis connection successful!");
  } catch (error) {
    console.error("Redis connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (client.isOpen) {
      await client.quit();
    }
  }
}

await testRedis();
