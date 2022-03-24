import IORedis from "ioredis";

class RedisClient {
  static connection: IORedis.Redis;
  static connected = false;

  static async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const { REDIS_URI } = process.env;

    if (!REDIS_URI) {
      throw new Error("No redis configuration provided");
    }

    try {
      this.connection = new IORedis(REDIS_URI, {
        maxRetriesPerRequest: null, // These options are required for BullMQ
        enableReadyCheck: false,
      });
      // Wait for connection to establish.
      console.log(`I said PING, Redis said ${await this.connection.ping()}`);

      this.connected = true;
    } catch (error) {
      console.error(error.message);
      console.error(
        "Failed to connect to redis. Exiting with exit status code 1."
      );
      process.exit(1);
    }
  }

  static getConnection(): IORedis.Redis | undefined {
    if (this.connected) {
      return this.connection;
    }

    return undefined;
  }
}

export default RedisClient;
