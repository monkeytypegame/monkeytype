const express = require("express");
const { config } = require("dotenv");
const path = require("path");
const MonkeyError = require("./handlers/error");
config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./credentials/serviceAccountKey.json");
const { connectDB, mongoDB } = require("./init/mongodb");

const PORT = process.env.PORT || 5005;

async function main() {
  await connectDB();
  await admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Database Connected");
  refactor();
}

main();

async function refactor() {
  console.log("getting all users");
  let users = await mongoDB().collection("users").find({}).toArray();
  console.log(users.length);
  for (let user of users) {
    let obj = user.personalBests;

    lbPb = {
      time: {
        15: {},
        60: {},
      },
    };
    let bestForEveryLanguage = {};
    if (obj?.time?.[15]) {
      obj.time[15].forEach((pb) => {
        if (!bestForEveryLanguage[pb.language]) {
          bestForEveryLanguage[pb.language] = pb;
        } else {
          if (bestForEveryLanguage[pb.language].wpm < pb.wpm) {
            bestForEveryLanguage[pb.language] = pb;
          }
        }
      });
      Object.keys(bestForEveryLanguage).forEach((key) => {
        lbPb.time[15][key] = bestForEveryLanguage[key];
      });
      bestForEveryLanguage = {};
    }
    if (obj?.time?.[60]) {
      obj.time[60].forEach((pb) => {
        if (!bestForEveryLanguage[pb.language]) {
          bestForEveryLanguage[pb.language] = pb;
        } else {
          if (bestForEveryLanguage[pb.language].wpm < pb.wpm) {
            bestForEveryLanguage[pb.language] = pb;
          }
        }
      });
      Object.keys(bestForEveryLanguage).forEach((key) => {
        lbPb.time[60][key] = bestForEveryLanguage[key];
      });
    }

    await mongoDB()
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { lbPersonalBests: lbPb } });
    console.log(`updated ${user.name}`);
  }
  console.log("done");
}
