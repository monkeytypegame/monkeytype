import IORedis from "ioredis";
import Logger from "../utils/logger";

let connection: IORedis.Redis;
let connected = false;

export async function connect(): Promise<void> {
  if (connected) {
    return;
  }

  const { REDIS_URI, MODE } = process.env;

  if (!REDIS_URI) {
    if (MODE === "dev") {
      Logger.warning("No redis configuration provided. Running without redis.");
      return;
    }
    throw new Error("No redis configuration provided");
  }

  connection = new IORedis(REDIS_URI, {
    maxRetriesPerRequest: null, // These options are required for BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  try {
    await connection.connect();
    connected = true;
  } catch (error) {
    if (MODE === "dev") {
      await connection.quit();
      Logger.warning(
        `Failed to connect to redis. Continuing in dev mode, running without redis.`
      );
    } else {
      Logger.error(error.message);
      Logger.error(
        "Failed to connect to redis. Exiting with exit status code 1."
      );
      process.exit(1);
    }
  }
}

export function isConnected(): boolean {
  return connected;
}

export function getConnection(): IORedis.Redis | undefined {
  return connection;
}
