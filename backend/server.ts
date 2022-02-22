import "dotenv/config";
import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "./credentials/serviceAccountKey.json";
import db from "./init/db.js";
import jobs from "./jobs";
import ConfigurationDAO from "./dao/configuration.js";
import app from "./app";

async function bootServer(port) {
  try {
    console.log("Connecting to database...");
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
    await ConfigurationDAO.getLiveConfiguration();
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

const PORT = process.env.PORT || 5005;

bootServer(PORT);
