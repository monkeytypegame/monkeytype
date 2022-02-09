import express from "express";
import "dotenv/config";
import MonkeyError from "./handlers/error.js";
import cors from "cors";
import admin, { ServiceAccount } from "firebase-admin";
import Logger from "./handlers/logger.js";
import serviceAccount from "./credentials/serviceAccountKey.json";
import db from "./init/db.js";
import jobs from "./jobs/index.js";
import addApiRoutes from "./api/routes/index.js";
import contextMiddleware from "./middlewares/context.js";
import ConfigurationDAO from "./dao/configuration.js";

const PORT = process.env.PORT || 5005;

// MIDDLEWARE & SETUP
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.set("trust proxy", 1);

app.use(contextMiddleware);

app.use((req, res, next) => {
  if (process.env.MAINTENANCE === "true" || req.ctx.configuration.maintenance) {
    res.status(503).json({ message: "Server is down for maintenance" });
  } else {
    next();
  }
});

addApiRoutes(app);

//DO NOT REMOVE NEXT, EVERYTHING WILL EXPLODE
app.use(function (e, req, res, _next) {
  if (/ECONNREFUSED.*27017/i.test(e.message)) {
    e.message = "Could not connect to the database. It may have crashed.";
    delete e.stack;
  }

  let monkeyError;
  if (e.errorID) {
    //its a monkey error
    monkeyError = e;
  } else {
    //its a server error
    monkeyError = new MonkeyError(e.status, e.message, e.stack);
  }
  if (!monkeyError.uid && req.ctx?.decodedToken) {
    monkeyError.uid = req.ctx.decodedToken.uid;
  }
  if (process.env.MODE !== "dev" && monkeyError.status > 400) {
    Logger.log(
      "system_error",
      `${monkeyError.status} ${monkeyError.message} ${monkeyError.stack}`,
      monkeyError.uid
    );
    db.collection("errors").insertOne({
      _id: monkeyError.errorID,
      timestamp: Date.now(),
      status: monkeyError.status,
      uid: monkeyError.uid,
      message: monkeyError.message,
      stack: monkeyError.stack,
    });
    monkeyError.stack = undefined;
  } else {
    console.error(monkeyError.message);
  }
  return res.status(monkeyError.status || 500).json(monkeyError);
});

console.log("Starting server...");
app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);

  console.log("Connecting to database...");
  await db.connect();
  console.log("Database connected");

  admin.initializeApp({
    credential: admin.credential.cert(
      (serviceAccount as unknown) as ServiceAccount
    ),
  });

  await ConfigurationDAO.getLiveConfiguration();

  console.log("Starting cron jobs...");
  jobs.forEach((job) => job.start());
});
