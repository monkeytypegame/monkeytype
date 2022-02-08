const { config } = require("dotenv");
const path = require("path");
config({ path: path.join(__dirname, ".env") });

const db = require("./init/db");
const admin = require("firebase-admin");
const serviceAccount = require("./credentials/serviceAccountKey.json");

async function main() {
  await db.connect();
  await admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Database Connected");
  refactor();
}

main();

async function refactor() {
  console.log("getting all users");

  const usersCollection = db.collection("users");
  let users = await usersCollection.find({}).toArray();
  console.log(users.length);

  for (let user of users) {
    let obj = user.personalBests;

    let lbPb = {
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

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lbPersonalBests: lbPb } }
    );
    console.log(`updated ${user.name}`);
  }
  console.log("done");
}
