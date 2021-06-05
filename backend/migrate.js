const admin = require("firebase-admin");
const mongoose = require("mongoose");
const { User } = require("./models/user");
const { Leaderboard } = require("./models/leaderboard");
const { Stats } = require("./models/stats");
const { BotCommand } = require("./models/bot-command");

const serviceAccount = require("../functions/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

var db = admin.firestore();

const port = process.env.PORT || "5005";

mongoose.connect("mongodb://localhost:27017/monkeytype", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Database should be completely clear before this is ran in order to prevent overlapping documents
// Migrate users
userCount = 1;
db.collection("users")
  // .where("name","==","mio")
  .get()
  .then((querySnapshot) => {
    // console.log('start of foreach');
    querySnapshot.forEach((userDoc) => {
        let newUser = new User(userDoc.data());
        newUser.uid = userDoc.id;
        newUser.globalStats = {
          started: userDoc.data().startedTests,
          completed: userDoc.data().completedTests,
          time: userDoc.data().timeTyping,
        };
        let tagIdDict = {};
        db.collection(`users/${userDoc.id}/tags`)
          .get()
          .then((tagsSnapshot) => {
            tagsSnapshot.forEach((tagDoc) => {
              let formattedTag = tagDoc.data();
              formattedTag._id = mongoose.Types.ObjectId(); //generate new objectId
              tagIdDict[tagDoc.id] = formattedTag._id; //save pair of ids in memory to determine what to set new id as in result tags
              newUser.tags.push(formattedTag);
              console.log(`Tag ${tagDoc.id} saved for user ${userCount}`);
            });
            db.collection(`users/${userDoc.id}/results`)
              .get()
              .then((resultsSnapshot) => {
                let resCount = 1;
                resultsSnapshot.forEach((result) => {
                  let formattedResult = result.data();
                  formattedResult.tags.forEach((tag, index) => {
                    if (tagIdDict[tag])
                      formattedResult.tags[index] = tagIdDict[tag];
                  });
                  newUser.results.push(formattedResult);
                  console.log(`Result ${resCount} saved for user ${userCount}`);
                  resCount++;
                });
                newUser.results.sort((a, b) => {
                  return a.timestamp - b.timestamp;
                });
                db.collection(`users/${userDoc.id}/presets`)
                  .get()
                  .then((presetsSnapshot) => {
                    presetsSnapshot.forEach((preset) => {
                      newUser.presets.push(preset.data());
                    });
                    newUser.save();
                    console.log(`User ${userCount} (${newUser.uid}) saved`);
                    userCount++;
                  });
              });
          });
    });
    // console.log('end of foreach');
  });

//not tested because I can't get leaderboards to work on my fork for some reason
db.collection("leaderboards")
  .get()
  .then((leaderboardsSnapshot) => {
    leaderboardsSnapshot.forEach((lbDoc) => {
      let newLb = new Leaderboard(lbDoc.data());
      newLb.save();
    });
  });

//migrate bot-commands
db.collection("bot-commands")
  .get()
  .then((botCommandsSnapshot) => {
    botCommandsSnapshot.forEach((bcDoc) => {
      let newBotCommand = new BotCommand(bcDoc.data());
      newBotCommand.save();
    });
  });

//migrate public stats
db.collection("public")
  .doc("stats")
  .get()
  .then((ret) => {
    let stats = ret.data();
    let newStats = new Stats(stats);
    newStats.save();
  });
