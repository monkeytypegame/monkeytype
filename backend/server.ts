import "dotenv/config";
import admin, { ServiceAccount } from "firebase-admin";
// @ts-ignore
import serviceAccount from "./credentials/serviceAccountKey.json"; // eslint-disable-line require-path-exists/exists
import db from "./init/db";
import jobs from "./jobs";
import ConfigurationClient from "./init/configuration";
import app from "./app";
import { Server } from "http";

async function bootServer(port: number): Promise<Server> {
  try {
    console.log(`Connecting to database ${process.env.DB_NAME}...`);
    await db.connect();
    console.log("Connected to database");

    console.log("Initializing Firebase app instance...");
    admin.initializeApp({
      credential: admin.credential.cert(
        serviceAccount as unknown as ServiceAccount
      ),
    });
    console.log("Firebase app initialized");

    console.log("Fetching live configuration...");
    await ConfigurationClient.getLiveConfiguration();
    console.log("Live configuration fetched");

    console.log("Starting cron jobs...");
    jobs.forEach((job) => job.start());
    console.log("Cron jobs started");
  } catch (error) {
    console.error("Failed to boot server");
    console.error(error);
    return process.exit(1);
  }

  return app.listen(PORT, () => {
    console.log(`API server listening on port ${port}`);
  });
}

const PORT = parseInt(process.env.PORT ?? "5005", 10);

bootServer(PORT);
