import "dotenv/config";
import admin, { ServiceAccount } from "firebase-admin";
// @ts-ignore
import serviceAccount from "./credentials/serviceAccountKey.json"; // eslint-disable-line require-path-exists/exists
import * as db from "./init/db";
import jobs from "./jobs";
import { getLiveConfiguration } from "./init/configuration";
import app from "./app";
import { Server } from "http";
import { version } from "./version";
import { recordServerVersion } from "./utils/prometheus";
import * as RedisClient from "./init/redis";
import { initJobQueue } from "./tasks/george";
import Logger from "./utils/logger";

async function bootServer(port: number): Promise<Server> {
  try {
    Logger.info(`Connecting to database ${process.env.DB_NAME}...`);
    await db.connect();
    Logger.success("Connected to database");

    Logger.info("Initializing Firebase app instance...");
    admin.initializeApp({
      credential: admin.credential.cert(
        serviceAccount as unknown as ServiceAccount
      ),
    });
    Logger.success("Firebase app initialized");

    Logger.info("Fetching live configuration...");
    await getLiveConfiguration();
    Logger.success("Live configuration fetched");

    Logger.info("Connecting to redis...");
    await RedisClient.connect();

    if (RedisClient.isConnected()) {
      Logger.success("Connected to redis");

      Logger.info("Initializing task queues...");
      initJobQueue(RedisClient.getConnection());
      Logger.success("Task queues initialized");
    }

    Logger.info("Starting cron jobs...");
    jobs.forEach((job) => job.start());
    Logger.success("Cron jobs started");

    recordServerVersion(version);
  } catch (error) {
    Logger.error("Failed to boot server");
    Logger.error(error);
    return process.exit(1);
  }

  return app.listen(PORT, () => {
    Logger.success(`API server listening on port ${port}`);
  });
}

const PORT = parseInt(process.env.PORT ?? "5005", 10);

bootServer(PORT);
