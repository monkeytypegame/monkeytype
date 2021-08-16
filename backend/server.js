const express = require("express");
const { config } = require("dotenv");
const path = require("path");
const MonkeyError = require("./handlers/error");
config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./credentials/serviceAccountKey.json");
const { connectDB } = require("./init/mongodb");

const PORT = process.env.PORT || 5005;

// MIDDLEWARE &  SETUP
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: true }));

const userRouter = require("./api/routes/user");
app.use("/user", userRouter);
const configRouter = require("./api/routes/config");
app.use("/config", configRouter);
const resultRouter = require("./api/routes/result");
app.use("/results", resultRouter);
const presetRouter = require("./api/routes/preset");
app.use("/presets", presetRouter);

app.use(function (e, req, res, next) {
  let uid = undefined;
  if (req.decodedToken) {
    uid = req.decodedToken.uid;
  }
  let monkeyError = new MonkeyError(e.status, e.message, e.stack, uid);
  return res.status(e.status || 500).json(monkeyError);
});

app.get("/test", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, async () => {
  console.log(`listening on port ${PORT}`);
  await connectDB();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Database Connected");
});
