import "dotenv/config";
import admin, { ServiceAccount } from "firebase-admin";
// @ts-ignore
import serviceAccount from "./credentials/serviceAccountKey.json"; // eslint-disable-line require-path-exists/exists
import db from "./init/db";
import jobs from "./jobs";
import ConfigurationClient from "./init/configuration";
import app from "./app";
import { Server } from "http";
import { version } from "./version";
import { recordServerVersion } from "./utils/prometheus";
import RedisClient from "./init/redis";
import George from "./tasks/george";
import { logError, logSuccess } from "./utils/logger";

async function bootServer(port: number): Promise<Server> {
  try {
    console.log(`Connecting to database ${process.env.DB_NAME}...`);
    await db.connect();
    logSuccess("Database", "Connected to database");

    console.log("Initializing Firebase app instance...");
    admin.initializeApp({
      credential: admin.credential.cert(
        serviceAccount as unknown as ServiceAccount
      ),
    });
    logSuccess("Firebase", "Firebase app initialized");

    console.log("Fetching live configuration...");
    await ConfigurationClient.getLiveConfiguration();
    logSuccess("Live configuration", "Live configuration fetched");

    console.log("Connecting to redis...");
    await RedisClient.connect();

    if (RedisClient.isConnected()) {
      logSuccess("Redis", "Connected to redis");

      console.log("Initializing task queues...");
      George.initJobQueue(RedisClient.getConnection());
      logSuccess("Task Queues", "Task queues initialized");
    }

    console.log("Starting cron jobs...");
    jobs.forEach((job) => job.start());
    logSuccess("Cron Jobs", "Cron jobs started");

    recordServerVersion(version);
  } catch (error) {
    logError("Server", "Failed to boot server");
    if (typeof error === "string" || error instanceof String) {
      logError("Server", error);
    } else {
      console.error(error);
    }
    return process.exit(1);
  }

  return app.listen(PORT, () => {
    console.log(`API server listening on port ${port}`);
  });
}

const PORT = parseInt(process.env.PORT ?? "5005", 10);

bootServer(PORT);
