const { config } = require("dotenv");
const path = require("path");
config({ path: path.join(__dirname, ".env") });

const app = require("./app");
const jobs = require("./jobs");
const db = require("./init/db");
const admin = require("firebase-admin");
const ConfigurationDAO = require("./dao/configuration");
// eslint-disable-next-line
const serviceAccount = require("./credentials/serviceAccountKey.json");

async function bootServer(port) {
  try {
    console.log("Connecting to database...");
    await db.connect();
    console.log("Connected to database");

    console.log("Initializing Firebase app instance...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
