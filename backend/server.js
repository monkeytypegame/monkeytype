const express = require("express");
const { config } = require("dotenv");
const path = require("path");
config({ path: path.join(__dirname, ".env") });
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const admin = require("firebase-admin");
const helmet = require("helmet");
const { User } = require("./models/user");
const { Leaderboard } = require("./models/leaderboard");
const { BotCommand } = require("./models/bot-command");
const { Stats } = require("./models/stats");

// Firebase admin setup
//currently uses account key in functions to prevent repetition
const serviceAccount = require("./credentials/serviceAccountKey.json");
const { connectDB } = require("./init/mongodb");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// MIDDLEWARE &  SETUP
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(helmet());

const port = process.env.PORT || "5005";

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`listening on port ${process.env.PORT}`);
    });
  })
  .catch((e) => {
    console.log(e);
  });
const authRouter = require("./api/routes/auth");
app.use("/auth", authRouter);

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = await admin
    .auth()
    .verifyIdToken(req.headers.authorization.split(" ")[1]);
  if (token == null) {
    return res.sendStatus(401);
  } else {
    req.name = token.name;
    req.uid = token.user_id;
    next();
  }
}

// NON-ROUTE FUNCTIONS



//
// async function stripAndSave(uid, obj) {
//   if (obj.bailedOut === false) delete obj.bailedOut;
//   if (obj.blindMode === false) delete obj.blindMode;
//   if (obj.difficulty === "normal") delete obj.difficulty;
//   if (obj.funbox === "none") delete obj.funbox;
//   //stripping english causes issues in result filtering; this line:
//   //let langFilter = ResultFilters.getFilter("language", result.language);
//   //returns false if language isn't defined in result
//   //if (obj.language === "english") delete obj.language;
//   if (obj.numbers === false) delete obj.numbers;
//   if (obj.punctuation === false) delete obj.punctuation;

//   await User.findOne({ uid: uid }, (err, user) => {
//     user.results.push(obj);
//     user.save();
//   });
// }



// API





// BOT API
// Might want to move this to a seperate file and add some sort of middleware that can send error if the user is not found

app.use(function (e, req, res, next) {
  console.log("Error", e);
  return res.status(e.status || 500).json(e || {});
});
