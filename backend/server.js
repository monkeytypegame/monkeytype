const express = require("express");
const { config } = require("dotenv");
const path = require("path");
const MonkeyError = require("./handlers/error");
config({ path: path.join(__dirname, ".env") });
const CronJob = require("cron").CronJob;
const cors = require("cors");
const admin = require("firebase-admin");
const Logger = require("./handlers/logger.js");
const serviceAccount = require("./credentials/serviceAccountKey.json");
const { connectDB, mongoDB } = require("./init/mongodb");
const BotDAO = require("./dao/bot");

const PORT = process.env.PORT || 5005;

// MIDDLEWARE &  SETUP
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.set("trust proxy", 1);

app.use((req, res, next) => {
  if (process.env.MAINTENANCE === "true") {
    res.status(503).json({ message: "Server is down for maintenance" });
  } else {
    next();
  }
});

let startingPath = "";

if (process.env.API_PATH_OVERRIDE) {
  startingPath = "/" + process.env.API_PATH_OVERRIDE;
}

app.get("/", (req, res) => {
  res.status(204).json({ message: "OK" });
});

const userRouter = require("./api/routes/user");
app.use(startingPath + "/user", userRouter);
const configRouter = require("./api/routes/config");
app.use(startingPath + "/config", configRouter);
const resultRouter = require("./api/routes/result");
app.use(startingPath + "/results", resultRouter);
const presetRouter = require("./api/routes/preset");
app.use(startingPath + "/presets", presetRouter);
const quoteRatings = require("./api/routes/quote-ratings");
app.use(startingPath + "/quote-ratings", quoteRatings);
const psaRouter = require("./api/routes/psa");
app.use(startingPath + "/psa", psaRouter);
const leaderboardsRouter = require("./api/routes/leaderboards");
app.use(startingPath + "/leaderboard", leaderboardsRouter);
const newQuotesRouter = require("./api/routes/new-quotes");
app.use(startingPath + "/new-quotes", newQuotesRouter);

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

const LeaderboardsDAO = require("./dao/leaderboards");

console.log("Starting server...");
app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
  console.log("Connecting to database...");
  await connectDB();
  console.log("Database connected");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  let lbjob = new CronJob("30 4/5 * * * *", async () => {
    let before15 = await mongoDB()
      .collection("leaderboards.english.time.15")
      .find()
      .limit(10)
      .toArray();
    LeaderboardsDAO.update("time", "15", "english").then(async () => {
      let after15 = await mongoDB()
        .collection("leaderboards.english.time.15")
        .find()
        .limit(10)
        .toArray();

      let changed;
      let recent = false;
      for (let index in before15) {
        if (before15[index].uid !== after15[index].uid) {
          //something changed at this index
          if (after15[index].timestamp > Date.now() - 1000 * 60 * 10) {
            //checking if test is within 10 minutes
            recent = true;
          }
          changed = after15[index];
          break;
        }
      }
      if (changed && recent) {
        let name = changed.discordId ?? changed.name;
        BotDAO.announceLbUpdate(
          name,
          changed.rank,
          "time 15 english",
          changed.wpm,
          changed.raw,
          changed.acc,
          changed.consistency
        );
      }
    });

    let before60 = await mongoDB()
      .collection("leaderboards.english.time.60")
      .find()
      .limit(10)
      .toArray();
    LeaderboardsDAO.update("time", "60", "english").then(async () => {
      let after60 = await mongoDB()
        .collection("leaderboards.english.time.60")
        .find()
        .limit(10)
        .toArray();
      let changed;
      let recent = false;
      for (let index in before60) {
        if (before60[index].uid !== after60[index].uid) {
          //something changed at this index
          if (after60[index].timestamp > Date.now() - 1000 * 60 * 10) {
            //checking if test is within 10 minutes
            recent = true;
          }
          changed = after60[index];
          break;
        }
      }
      if (changed && recent) {
        let name = changed.discordId ?? changed.name;
        BotDAO.announceLbUpdate(
          name,
          changed.rank,
          "time 60 english",
          changed.wpm,
          changed.raw,
          changed.acc,
          changed.consistency
        );
      }
    });
  });
  lbjob.start();

  let logjob = new CronJob("0 0 0 * * *", async () => {
    let data = await mongoDB()
      .collection("logs")
      .deleteMany({ timestamp: { $lt: Date.now() - 604800000 } });
    Logger.log(
      "system_logs_deleted",
      `${data.deletedCount} logs deleted older than 7 days`,
      undefined
    );
  });
  logjob.start();
});
