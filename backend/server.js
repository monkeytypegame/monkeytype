const express = require("express");
const { config } = require("dotenv");
const path = require("path");
const MonkeyError = require("./handlers/error");
config({ path: path.join(__dirname, ".env") });
const cors = require("cors");
const admin = require("firebase-admin");
const Logger = require("./handlers/logger.js");
const serviceAccount = require("./credentials/serviceAccountKey.json");
const { connectDB, mongoDB } = require("./init/mongodb");
const jobs = require("./jobs");
const addApiRoutes = require("./api/routes");
const contextMiddleware = require("./middlewares/context");
const ConfigurationDAO = require("./dao/configuration");

const PORT = process.env.PORT || 5005;

// MIDDLEWARE &  SETUP
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.set("trust proxy", 1);

app.use(contextMiddleware);

app.use((req, res, next) => {
  if (
    process.env.MAINTENANCE === "true" ||
    req.context.configuration.maintenance
  ) {
    res.status(503).json({ message: "Server is down for maintenance" });
  } else {
    next();
  }
});

addApiRoutes(app);

//DO NOT REMOVE NEXT, EVERYTHING WILL EXPLODE
app.use(function (e, req, res, next) {
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
  if (!monkeyError.uid && req.decodedToken) {
    monkeyError.uid = req.decodedToken.uid;
  }
  if (process.env.MODE !== "dev" && monkeyError.status > 400) {
    Logger.log(
      "system_error",
      `${monkeyError.status} ${monkeyError.message}`,
      monkeyError.uid
    );
    mongoDB().collection("errors").insertOne({
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
  await connectDB();
  console.log("Database connected");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  await ConfigurationDAO.getLiveConfiguration();

  console.log("Starting cron jobs...");
  jobs.forEach((job) => job.start());
});
