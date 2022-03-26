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
import "colors";

async function bootServer(port: number): Promise<Server> {
  try {
    console.log(`Connecting to database ${process.env.DB_NAME}...`);
    await db.connect();
    console.log("Connected to database".green);

    console.log("Initializing Firebase app instance...");
    admin.initializeApp({
      credential: admin.credential.cert(
        serviceAccount as unknown as ServiceAccount
      ),
    });
    console.log("Firebase app initialized".green);

    console.log("Fetching live configuration...");
    await ConfigurationClient.getLiveConfiguration();
    console.log("Live configuration fetched".green);

    console.log("Connecting to redis...");
    await RedisClient.connect();

    if (RedisClient.isConnected()) {
      console.log("Connected to redis");

      console.log("Initializing task queues...");
      George.initJobQueue(RedisClient.getConnection());
      console.log("Task queues initialized".green);
    }

    console.log("Starting cron jobs...");
    jobs.forEach((job) => job.start());
    console.log("Cron jobs started".green);

    recordServerVersion(version);
  } catch (error) {
    console.error("Failed to boot server".red);
    if (typeof error === "string" || error instanceof String) {
      console.error(error.red);
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
