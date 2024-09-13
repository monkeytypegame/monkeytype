import "dotenv/config";
import * as db from "./init/db";
import jobs from "./jobs";
import { getLiveConfiguration } from "./init/configuration";
import app from "./app";
import { Server } from "http";
import { version } from "./version";
import { recordServerVersion } from "./utils/prometheus";
import * as RedisClient from "./init/redis";
import queues from "./queues";
import workers from "./workers";
import Logger from "./utils/logger";
import * as EmailClient from "./init/email-client";
import { init as initFirebaseAdmin } from "./init/firebase-admin";
import { createIndicies as leaderboardDbSetup } from "./dal/leaderboards";
import { createIndicies as blocklistDbSetup } from "./dal/blocklist";

async function bootServer(port: number): Promise<Server> {
  try {
    Logger.info(`Starting server version ${version}`);
    Logger.info(`Starting server in ${process.env["MODE"]} mode`);
    Logger.info(`Connecting to database ${process.env["DB_NAME"]}...`);
    await db.connect();
    Logger.success("Connected to database");

    Logger.info("Initializing Firebase app instance...");
    initFirebaseAdmin();

    Logger.info("Fetching live configuration...");
    await getLiveConfiguration();
    Logger.success("Live configuration fetched");

    Logger.info("Initializing email client...");
    await EmailClient.init();

    Logger.info("Connecting to redis...");
    await RedisClient.connect();

    if (RedisClient.isConnected()) {
      Logger.success("Connected to redis");
      const connection = RedisClient.getConnection();

      Logger.info("Initializing queues...");
      queues.forEach((queue) => {
        queue.init(connection);
      });
      Logger.success(
        `Queues initialized: ${queues
          .map((queue) => queue.queueName)
          .join(", ")}`
      );

      Logger.info("Initializing workers...");
      workers.forEach(async (worker) => {
        await worker(connection).run();
      });
      Logger.success(
        `Workers initialized: ${workers
          .map((worker) => worker(connection).name)
          .join(", ")}`
      );
    }

    Logger.info("Starting cron jobs...");
    jobs.forEach((job) => job.start());
    Logger.success("Cron jobs started");

    Logger.info("Setting up leaderboard indicies...");
    await leaderboardDbSetup();

    Logger.info("Setting up blocklist indicies...");
    await blocklistDbSetup();

    recordServerVersion(version);
  } catch (error) {
    Logger.error("Failed to boot server");
    Logger.error(error.message as string);
    console.error(error);
    return process.exit(1);
  }

  return app.listen(PORT, () => {
    Logger.success(`API server listening on port ${port}`);
  });
}

const PORT = parseInt(process.env["PORT"] ?? "5005", 10);

void bootServer(PORT);
