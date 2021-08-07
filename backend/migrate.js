const { config } = require("dotenv");
const path = require("path");
config({ path: path.join(__dirname, ".env") });
const { mongoDB } = require("./init/mongodb");
const { connectDB } = require("./init/mongodb");
const { ObjectID } = require("mongodb");
const { performance } = require("perf_hooks");
const fs = require("fs");

// const { QuerySnapshotData } = require("firebase-firestore");

console.log(config());

const admin = require("firebase-admin");

// const { User } = require("./models/user");
// const { Leaderboard } = require("./models/leaderboard");
// const { BotCommand } = require("./models/bot-command");

const serviceAccount = require("../functions/serviceAccountKey_live.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

var db = admin.firestore();
var auth = admin.auth();

// Database should be completely clear before this is ran in order to prevent overlapping documents
// Migrate users
async function migrateUsers() {
  // let UIDOVERRIDE = "ugbG1GiSHxVEYMDmMeLV9byeukl2";
  let UIDOVERRIDE = undefined;
  let lastId;
  try {
    lastId = fs.readFileSync("./lastId.txt", "utf8");
  } catch (e) {}
  let querySnapshot;
  if (lastId) {
    let lastSnapshot = await db.collection("users").doc(lastId).get();
    querySnapshot = await db
      .collection("users")
      // .where("name", "==", "Miodec")
      .orderBy("name")
      .startAfter(lastSnapshot)
      .limit(1)
      .get();
  } else {
    querySnapshot = await db
      .collection("users")
      // .where("name", "==", "Miodec")
      .orderBy("name")
      .limit(1)
      .get();
  }
  // console.log('start of foreach');
  console.log(`migrating ${querySnapshot.docs.length} users`);
  let fulllog = false;
  let currentIndex = 0;
  let totalUsers = querySnapshot.docs.length;
  let totalCompletionTime = 0;
  let averageCompletionTime = 0;
  for (const userDoc of querySnapshot.docs) {
    let userstart = performance.now();
    let userData = userDoc.data();
    let uid = userDoc.id;
    try {
      let userAuth = await auth.getUser(uid);
      let email = userAuth.email;
      let userCreatedAt = new Date(userAuth.metadata.creationTime).getTime();

      let mongoUser = {
        name: userData.name,
        email: email,
        addedAt: userCreatedAt,
        uid: UIDOVERRIDE ? UIDOVERRIDE : uid,
        oldTypingStats: {},
      };

      if (userData.completedTests)
        mongoUser.oldTypingStats.completedTests = userData.completedTests;
      if (userData.discordId) mongoUser.discordId = userData.discordId;
      if (userData.startedTests)
        mongoUser.oldTypingStats.startedTests = userData.startedTests;
      if (userData.timeTyping)
        mongoUser.oldTypingStats.timeTyping = userData.timeTyping;

      if (userData.personalBests)
        mongoUser.personalBests = userData.personalBests;

      let tagPairs = {};

      let mongoUserTags = [];

      if (fulllog) console.log(`${uid} migrating tags`);
      let tagsSnapshot = await db.collection(`users/${uid}/tags`).get();
      await tagsSnapshot.forEach(async (tagDoc) => {
        let tagData = tagDoc.data();
        let tagId = tagDoc.id;
        let new_id = ObjectID();
        tagPairs[tagId] = new_id;
        let tagtopush = { _id: new_id, name: tagData.name };
        if (tagData.personalBests)
          tagtopush.personalBests = tagData.personalBests;
        mongoUserTags.push(tagtopush);
      });

      mongoUser.tags = mongoUserTags;

      if (fulllog) console.log(`${uid} migrating config`);
      if (userData.config) {
        await mongoDB()
          .collection("configs")
          .updateOne(
            { uid: UIDOVERRIDE ? UIDOVERRIDE : uid },
            {
              $set: {
                uid: UIDOVERRIDE ? UIDOVERRIDE : uid,
                config: userData.config,
              },
            },
            { upsert: true }
          );
      }

      if (fulllog) console.log(`${uid} migrating presets`);
      let presetsSnapshot = await db.collection(`users/${uid}/presets`).get();
      await presetsSnapshot.forEach(async (presetDoc) => {
        let presetData = presetDoc.data();
        let newpreset = {
          uid: UIDOVERRIDE ? UIDOVERRIDE : uid,
          name: presetData.name,
        };
        if (presetData.config) newpreset.config = presetData.config;
        await mongoDB().collection("presets").insertOne(newpreset);
      });

      let lastcount = 0;
      let limit = 1000;
      let lastdoc = "start";
      let total = 0;
      let newStats = {
        completedTests: 0,
        startedTests: 0,
        timeTyping: 0,
      };
      if (fulllog) console.log(`${uid} migrating results`);
      do {
        if (fulllog) console.log(`${total} so far`);
        let resultsSnapshot;
        if (lastdoc === "start") {
          resultsSnapshot = await db
            .collection(`users/${uid}/results`)
            .orderBy("timestamp", "desc")
            .limit(limit)
            .get();
        } else {
          resultsSnapshot = await db
            .collection(`users/${uid}/results`)
            .orderBy("timestamp", "desc")
            .startAfter(lastdoc)
            .limit(limit)
            .get();
        }
        await resultsSnapshot.forEach(async (resultDoc) => {
          let resultData = resultDoc.data();
          resultData.uid = UIDOVERRIDE ? UIDOVERRIDE : uid;
          if (resultData.tags && resultData.tags.length > 0) {
            resultData.tags = resultData.tags.map((tag) => tagPairs[tag]);
          }
          if (!resultData.charStats) {
            resultData.charStats = [
              resultData.correctChars,
              resultData.incorrectChars,
            ];
          }
          delete resultData.correctChars;
          delete resultData.incorrectChars;
          resultData.charStats = newStats.completedTests++;
          if (resultData.restartCount) {
            newStats.startedTests += resultData.restartCount + 1;
          } else {
            newStats.startedTests++;
          }
          if (resultData.testDuration) {
            newStats.timeTyping += parseFloat(resultData.testDuration);
          }
          if (resultData.incompleteTestSeconds) {
            newStats.timeTyping += resultData.incompleteTestSeconds;
          }
          await mongoDB().collection("results").insertOne(resultData);
        });
        lastcount = resultsSnapshot.docs.length;
        lastdoc = resultsSnapshot.docs[resultsSnapshot.docs.length - 1];
        total += lastcount;
      } while (lastcount > 0);

      if (fulllog) console.log(`${uid} migrated ${total} results`);

      mongoUser.completedTests = newStats.completedTests;
      mongoUser.startedTests = newStats.startedTests;
      mongoUser.timeTyping = newStats.timeTyping;

      if (fulllog) console.log(`${uid} migrating user doc`);
      await mongoDB()
        .collection("users")
        .updateOne(
          { uid: UIDOVERRIDE ? UIDOVERRIDE : uid },
          {
            $set: mongoUser,
          },
          { upsert: true }
        );

      console.log(
        `${uid} migrated \t\t ${userData.name} \t\t ${total} results`
      );
      fs.appendFileSync(
        "log_success.txt",
        `${uid} ${userData.name} ${total} \n`,
        "utf8"
      );
    } catch (err) {
      console.log(`${uid} failed`);
      console.log(err);
      fs.appendFileSync("log_failed.txt", `${uid} ${err.message} \n`, "utf8");
    }
    fs.writeFileSync("lastId.txt", uid, "utf8");
    let userend = performance.now();
    let time = (userend - userstart) / 1000;
    totalCompletionTime += time;
    // console.log(`${uid} took ${time} seconds`);
    averageCompletionTime = totalCompletionTime / currentIndex + 1;
    currentIndex++;
    let estimateSecondsLeft =
      averageCompletionTime * (totalUsers - currentIndex);
    console.log(
      `${currentIndex}/${totalUsers} users | estimated ${secondsToString(
        estimateSecondsLeft,
        true
      )} left`
    );

    // console.log(userData);
    //   let newUser;
    //   try{
    //     let data = userDoc.data();
    //     data._id = userDoc.id;
    //     newUser = new User(data);
    //     newUser.uid = userDoc.id;
    //     newUser.globalStats = {
    //       started: userDoc.data().startedTests,
    //       completed: userDoc.data().completedTests,
    //       time: userDoc.data().timeTyping,
    //     };
    //     let tagIdDict = {};
    //     let tagsSnapshot = await db.collection(`users/${userDoc.id}/tags`).get();
    //     tagsSnapshot.forEach((tagDoc) => {
    //       let formattedTag = tagDoc.data();
    //       formattedTag._id = mongoose.Types.ObjectId(); //generate new objectId
    //       tagIdDict[tagDoc.id] = formattedTag._id; //save pair of ids in memory to determine what to set new id as in result tags
    //       newUser.tags.push(formattedTag);
    //       console.log(`Tag ${tagDoc.id} saved for user ${userCount}`);
    //     });
    //     let resultsSnapshot = await db.collection(`users/${userDoc.id}/results`).get();
    //     let resCount = 1;
    //     resultsSnapshot.forEach((result) => {
    //       let formattedResult = result.data();
    //       if(formattedResult.tags != undefined){
    //         formattedResult.tags.forEach((tag, index) => {
    //           if (tagIdDict[tag])
    //             formattedResult.tags[index] = tagIdDict[tag];
    //         });
    //       }
    //       newUser.results.push(formattedResult);
    //       console.log(`Result ${resCount} saved for user ${userCount}`);
    //       resCount++;
    //     });
    //     newUser.results.sort((a, b) => {
    //       return a.timestamp - b.timestamp;
    //     });
    //     let presetsSnapshot = await db.collection(`users/${userDoc.id}/presets`).get();
    //     presetsSnapshot.forEach((preset) => {
    //       newUser.presets.push(preset.data());
    //     });
    //     await newUser.save();
    //     console.log(`User ${userCount} (${newUser.uid}) saved`);
    //     userCount++;
    //   }catch(e){
    //     // throw e;
    //     console.log(`User ${userCount} (${newUser.uid}) failed: ${e.message}`);
    //     userCount++;
    //   }
  }

  console.log("Migration complete");
  // console.log('end of foreach');
}
// //not tested because I can't get leaderboards to work on my fork for some reason
// db.collection("leaderboards")
//   .get()
//   .then((leaderboardsSnapshot) => {
//     leaderboardsSnapshot.forEach((lbDoc) => {
//       let newLb = new Leaderboard(lbDoc.data());
//       newLb.save();
//     });
//   });

// //migrate bot-commands
// db.collection("bot-commands")
//   .get()
//   .then((botCommandsSnapshot) => {
//     botCommandsSnapshot.forEach((bcDoc) => {
//       let newBotCommand = new BotCommand(bcDoc.data());
//       newBotCommand.save();
//     });
//   });

//migrate public stat
async function migratePublicStats() {
  db.collection("public")
    .doc("stats")
    .get()
    .then((ret) => {
      let stats = ret.data();
      mongoDB()
        .collection("public")
        .updateOne(
          { type: "stats" },
          {
            $set: {
              completedTests: stats.completedTests,
              startedTests: stats.startedTests,
              timeTyping: stats.timeTyping,
            },
          },
          { upsert: true }
        );
    });
}

async function init() {
  await connectDB();
  // await migratePublicStats();
  await migrateUsers();
  // process.exit(1);
}

function secondsToString(sec, full = false) {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.round((sec % 3600) % 60);
  let hoursString;
  let minutesString;
  let secondsString;
  hours < 10 ? (hoursString = "0" + hours) : (hoursString = hours);
  minutes < 10 ? (minutesString = "0" + minutes) : (minutesString = minutes);
  seconds < 10 && (minutes > 0 || hours > 0 || full)
    ? (secondsString = "0" + seconds)
    : (secondsString = seconds);

  let ret = "";
  if (hours > 0 || full) ret += hoursString + ":";
  if (minutes > 0 || hours > 0 || full) ret += minutesString + ":";
  ret += secondsString;
  return ret;
}

init();
