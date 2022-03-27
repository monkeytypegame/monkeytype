import IORedis from "ioredis";
import Logger from "../utils/logger";

class RedisClient {
  static connection: IORedis.Redis;
  static connected = false;

  static async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const { REDIS_URI } = process.env;

    if (!REDIS_URI) {
      if (process.env.MODE === "dev") {
        Logger.warning(
          "No redis configuration provided. Running without redis."
        );
        return;
      }
      throw new Error("No redis configuration provided");
    }

    this.connection = new IORedis(REDIS_URI, {
      maxRetriesPerRequest: null, // These options are required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    try {
      await this.connection.connect();
      this.connected = true;
    } catch (error) {
      Logger.error(error.message);
      Logger.error(
        "Failed to connect to redis. Exiting with exit status code 1."
      );
      process.exit(1);
    }
  }

  static isConnected(): boolean {
    return this.connected;
  }

  static getConnection(): IORedis.Redis {
    return this.connection;
  }
}

export default RedisClient;
