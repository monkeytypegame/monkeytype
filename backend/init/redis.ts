import IORedis from "ioredis";

class RedisClient {
  static connection: IORedis.Redis;
  static connected = false;

  static async connect(): Promise<boolean> {
    if (this.connected) {
      return true;
    }

    const { REDIS_URI } = process.env;

    if (!REDIS_URI) {
      if (process.env.MODE === "dev") {
        console.log("No redis configuration provided. Running without redis.");
        return false;
      } else {
        throw new Error("No redis configuration provided");
      }
    }

    this.connection = new IORedis(REDIS_URI, {
      maxRetriesPerRequest: null, // These options are required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    try {
      await this.connection.connect();
      this.connected = true;
      return true;
    } catch (error) {
      console.error(error.message);
      console.error(
        "Failed to connect to redis. Exiting with exit status code 1."
      );
      process.exit(1);
    }
  }

  static getConnection(): IORedis.Redis {
    return this.connection;
  }
}

export default RedisClient;
