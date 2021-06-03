const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
const { User } = require("./models/user");
const { Leaderboard } = require("./models/leaderboard");

// Firebase admin setup
//currently uses account key in functions to prevent repetition
const serviceAccount = require("../functions/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// MIDDLEWARE &  SETUP
const app = express();
app.use(cors());

const port = process.env.PORT || "5005";

mongoose.connect("mongodb://localhost:27017/monkeytype", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const mtRootDir = __dirname.substring(0, __dirname.length - 8); //will this work for windows and mac computers?
app.use(express.static(mtRootDir + "/dist"));
app.use(bodyParser.json());

// Daily leaderboard clear function
function clearDailyLeaderboards() {
  var nextClear = new Date();
  nextClear.setHours(24, 0, 0, 0); //next occurrence of 12am
  let currentTime = new Date();
  Leaderboard.find({ type: "daily" }, (err, lbs) => {
    lbs.forEach((lb) => {
      lb.resetTime = nextClear;
      lb.save();
    });
  });
  setTimeout(() => {
    Leaderboard.find({ type: "daily" }, (err, lbs) => {
      lbs.forEach((lb) => {
        lb.board = [];
        lb.save();
      });
    });
    clearDailyLeaderboards();
  }, nextClear.getTime() - currentTime.getTime());
}

// Initialize database leaderboards if no leaderboards exist and start clearDailyLeaderboards
Leaderboard.findOne((err, lb) => {
  if (lb === null) {
    let lb = {
      size: 999,
      board: [],
      mode: "time",
      mode2: 15,
      type: "global",
    };
    Leaderboard.create(lb);
    lb.mode2 = 60;
    Leaderboard.create(lb);
    lb.type = "daily";
    lb.size = 100;
    Leaderboard.create(lb);
    lb.mode2 = 15;
    Leaderboard.create(lb);
  }
}).then(() => {
  clearDailyLeaderboards();
});

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

function validateResult(result) {
  if (result.wpm > result.rawWpm) {
    console.error(
      `Could not validate result for ${result.uid}. ${result.wpm} > ${result.rawWpm}`
    );
    return false;
  }
  let wpm = roundTo2((result.correctChars * (60 / result.testDuration)) / 5);
  if (
    wpm < result.wpm - result.wpm * 0.01 ||
    wpm > result.wpm + result.wpm * 0.01
  ) {
    console.error(
      `Could not validate result for ${result.uid}. wpm ${wpm} != ${result.wpm}`
    );
    return false;
  }
  // if (result.allChars != undefined) {
  //   let raw = roundTo2((result.allChars * (60 / result.testDuration)) / 5);
  //   if (
  //     raw < result.rawWpm - result.rawWpm * 0.01 ||
  //     raw > result.rawWpm + result.rawWpm * 0.01
  //   ) {
  //     console.error(
  //       `Could not validate result for ${result.uid}. raw ${raw} != ${result.rawWpm}`
  //     );
  //     return false;
  //   }
  // }
  if (result.mode === "time" && (result.mode2 === 15 || result.mode2 === 60)) {
    let keyPressTimeSum =
      result.keySpacing.reduce((total, val) => {
        return total + val;
      }) / 1000;
    if (
      keyPressTimeSum < result.testDuration - 1 ||
      keyPressTimeSum > result.testDuration + 1
    ) {
      console.error(
        `Could not validate key spacing sum for ${result.uid}. ${keyPressTimeSum} !~ ${result.testDuration}`
      );
      return false;
    }

    if (
      result.testDuration < result.mode2 - 1 ||
      result.testDuration > result.mode2 + 1
    ) {
      console.error(
        `Could not validate test duration for ${result.uid}. ${result.testDuration} !~ ${result.mode2}`
      );
      return false;
    }
  }

  if (result.chartData.raw !== undefined) {
    if (result.chartData.raw.filter((w) => w > 350).length > 0) return false;
  }

  if (result.wpm > 100 && result.consistency < 10) return false;

  return true;
}

function roundTo2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

async function checkIfPB(obj, userdata) {
  let pbs = null;
  if (obj.mode == "quote") {
    return false;
  }
  if (obj.funbox !== "none") {
    return false;
  }
  try {
    pbs = userdata.personalBests;
    if (pbs === undefined) {
      throw new Error("pb is undefined");
    }
  } catch (e) {
    User.findOne({ uid: userdata.uid }, (err, user) => {
      user.personalBests = {
        [obj.mode]: {
          [obj.mode2]: [
            {
              language: obj.language,
              difficulty: obj.difficulty,
              punctuation: obj.punctuation,
              wpm: obj.wpm,
              acc: obj.acc,
              raw: obj.rawWpm,
              timestamp: Date.now(),
              consistency: obj.consistency,
            },
          ],
        },
      };
    }).then(() => {
      return true;
    });
  }
  // //check mode, mode2, punctuation, language and difficulty

  let toUpdate = false;
  let found = false;
  try {
    if (pbs[obj.mode][obj.mode2] === undefined) {
      pbs[obj.mode][obj.mode2] = [];
    }
    pbs[obj.mode][obj.mode2].forEach((pb) => {
      if (
        pb.punctuation === obj.punctuation &&
        pb.difficulty === obj.difficulty &&
        pb.language === obj.language
      ) {
        //entry like this already exists, compare wpm
        found = true;
        if (pb.wpm < obj.wpm) {
          //new pb
          pb.wpm = obj.wpm;
          pb.acc = obj.acc;
          pb.raw = obj.rawWpm;
          pb.timestamp = Date.now();
          pb.consistency = obj.consistency;
          toUpdate = true;
        } else {
          //no pb
          return false;
        }
      }
    });
    //checked all pbs, nothing found - meaning this is a new pb
    if (!found) {
      pbs[obj.mode][obj.mode2] = [
        {
          language: obj.language,
          difficulty: obj.difficulty,
          punctuation: obj.punctuation,
          wpm: obj.wpm,
          acc: obj.acc,
          raw: obj.rawWpm,
          timestamp: Date.now(),
          consistency: obj.consistency,
        },
      ];
      toUpdate = true;
    }
  } catch (e) {
    // console.log(e);
    pbs[obj.mode] = {};
    pbs[obj.mode][obj.mode2] = [
      {
        language: obj.language,
        difficulty: obj.difficulty,
        punctuation: obj.punctuation,
        wpm: obj.wpm,
        acc: obj.acc,
        raw: obj.rawWpm,
        timestamp: Date.now(),
        consistency: obj.consistency,
      },
    ];
    toUpdate = true;
  }

  if (toUpdate) {
    User.findOne({ uid: userdata.uid }, (err, user) => {
      user.personalBests = pbs;
      user.save();
    });
    return true;
  } else {
    return false;
  }
}

async function checkIfTagPB(obj, userdata) {
  //function returns a list of tag ids where a pb was set //i think
  if (obj.tags.length === 0) {
    return [];
  }
  if (obj.mode == "quote") {
    return [];
  }
  let dbtags = []; //tags from database: include entire document: name, id, pbs
  let restags = obj.tags; //result tags
  try {
    let snap;
    await User.findOne({ uid: userdata.uid }, (err, user) => {
      snap = user.tags;
    });
    snap.forEach((doc) => {
      //if (restags.includes(doc._id)) {
      //if (restags.indexOf((doc._id).toString()) > -1) {
      if (restags.includes(doc._id.toString())) {
        //not sure what this is supposed to do
        /*
        let data = doc.data();
        data.id = doc.id;
        dbtags.push(data);
        */
        dbtags.push(doc);
      }
    });
  } catch {
    return [];
  }
  let ret = [];
  for (let i = 0; i < dbtags.length; i++) {
    let pbs = null;
    try {
      pbs = dbtags[i].personalBests;
      if (pbs === undefined || pbs === {}) {
        throw new Error("pb is undefined");
      }
    } catch (e) {
      //if pb is undefined, create a new personalBests field with only specified value
      await User.findOne({ uid: userdata.uid }, (err, user) => {
        //it might be more convenient if tags was an object with ids as the keys
        //find tag index in tags list
        // save that tags personal bests as object
        let j = user.tags.findIndex((tag) => {
          return tag._id.toString() == dbtags[i]._id.toString();
        });
        user.tags[j].personalBests = {
          [obj.mode]: {
            [obj.mode2]: [
              {
                language: obj.language,
                difficulty: obj.difficulty,
                punctuation: obj.punctuation,
                wpm: obj.wpm,
                acc: obj.acc,
                raw: obj.rawWpm,
                timestamp: Date.now(),
                consistency: obj.consistency,
              },
            ],
          },
        };
        pbs = user.tags[j].personalBests;
        user.save();
      }).then((updatedUser) => {
        ret.push(dbtags[i]._id.toString());
      });
      continue;
    }
    let toUpdate = false;
    let found = false;
    try {
      if (pbs[obj.mode] === undefined) {
        pbs[obj.mode] = { [obj.mode2]: [] };
      } else if (pbs[obj.mode][obj.mode2] === undefined) {
        pbs[obj.mode][obj.mode2] = [];
      }
      pbs[obj.mode][obj.mode2].forEach((pb) => {
        if (
          pb.punctuation === obj.punctuation &&
          pb.difficulty === obj.difficulty &&
          pb.language === obj.language
        ) {
          //entry like this already exists, compare wpm
          found = true;
          if (pb.wpm < obj.wpm) {
            //replace old pb with new obj
            pb.wpm = obj.wpm;
            pb.acc = obj.acc;
            pb.raw = obj.rawWpm;
            pb.timestamp = Date.now();
            pb.consistency = obj.consistency;
            toUpdate = true;
          } else {
            //no pb
            return false;
          }
        }
      });
      //checked all pbs, nothing found - meaning this is a new pb
      if (!found) {
        console.log("Semi-new pb");
        //push this pb to array
        pbs[obj.mode][obj.mode2].push({
          language: obj.language,
          difficulty: obj.difficulty,
          punctuation: obj.punctuation,
          wpm: obj.wpm,
          acc: obj.acc,
          raw: obj.rawWpm,
          timestamp: Date.now(),
          consistency: obj.consistency,
        });
        toUpdate = true;
      }
    } catch (e) {
      // console.log(e);
      console.log("Catch pb");
      console.log(e);
      pbs[obj.mode] = {};
      pbs[obj.mode][obj.mode2] = [
        {
          language: obj.language,
          difficulty: obj.difficulty,
          punctuation: obj.punctuation,
          wpm: obj.wpm,
          acc: obj.acc,
          raw: obj.rawWpm,
          timestamp: Date.now(),
          consistency: obj.consistency,
        },
      ];
      toUpdate = true;
    }

    if (toUpdate) {
      //push working pb array to user tags pbs
      await User.findOne({ uid: userdata.uid }, (err, user) => {
        //it might be more convenient if tags was an object with ids as the keys
        for (let j = 0; j < user.tags.length; j++) {
          if (user.tags[j]._id.toString() === dbtags[i]._id.toString()) {
            user.tags[j].personalBests = pbs;
          }
        }
        user.save();
      });
      ret.push(dbtags[i]._id.toString());
    }
  }
  console.log(ret);
  return ret;
}

async function stripAndSave(uid, obj) {
  if (obj.bailedOut === false) delete obj.bailedOut;
  if (obj.blindMode === false) delete obj.blindMode;
  if (obj.difficulty === "normal") delete obj.difficulty;
  if (obj.funbox === "none") delete obj.funbox;
  //stripping english causes issues in result filtering; this line:
  //let langFilter = ResultFilters.getFilter("language", result.language);
  //returns false if language isn't defined in result
  //if (obj.language === "english") delete obj.language;
  if (obj.numbers === false) delete obj.numbers;
  if (obj.punctuation === false) delete obj.punctuation;

  await User.findOne({ uid: uid }, (err, user) => {
    user.results.push(obj);
    user.save();
  });
}

function incrementT60Bananas(uid, result, userData) {
  try {
    let best60;
    try {
      best60 = Math.max(
        ...userData.personalBests.time[60].map((best) => best.wpm)
      );
      if (!Number.isFinite(best60)) {
        throw "Not finite";
      }
    } catch (e) {
      best60 = undefined;
    }

    if (best60 != undefined && result.wpm < best60 - best60 * 0.25) {
      // console.log("returning");
      return;
    } else {
      //increment
      // console.log("checking");
      User.findOne({ uid: uid }, (err, user) => {
        if (user.bananas === undefined) {
          user.bananas.t60bananas = 1;
        } else {
          user.bananas.t60bananas += 1;
        }
        user.save();
      });
    }
  } catch (e) {
    console.log(
      "something went wrong when trying to increment bananas " + e.message
    );
  }
}

async function incrementGlobalTypingStats(userData, resultObj) {
  let userGlobalStats = userData.globalStats;
  try {
    let newStarted;
    let newCompleted;
    let newTime;

    let tt = 0;
    let afk = resultObj.afkDuration;
    if (afk == undefined) {
      afk = 0;
    }
    tt = resultObj.testDuration + resultObj.incompleteTestSeconds - afk;

    if (tt > 500)
      console.log(
        `FUCK, INCREASING BY A LOT ${resultObj.uid}: ${JSON.stringify(
          resultObj
        )}`
      );

    if (userGlobalStats.started === undefined) {
      newStarted = resultObj.restartCount + 1;
    } else {
      newStarted = userGlobalStats.started + resultObj.restartCount + 1;
    }
    if (userGlobalStats.completed === undefined) {
      newCompleted = 1;
    } else {
      newCompleted = userGlobalStats.completed + 1;
    }
    if (userGlobalStats.time === undefined) {
      newTime = tt;
    } else {
      newTime = userGlobalStats.time + tt;
    }
    // db.collection("users")
    //   .doc(uid)
    //   .update({
    //     startedTests: newStarted,
    //     completedTests: newCompleted,
    //     timeTyping: roundTo2(newTime),
    //   });
    incrementPublicTypingStats(resultObj.restartCount + 1, 1, tt);
    User.findOne({ uid: userData.uid }, (err, user) => {
      user.globalStats = {
        started: newStarted,
        completed: newCompleted,
        time: roundTo2(newTime),
      };
      user.save();
    });
  } catch (e) {
    console.error(`Error while incrementing stats for user ${uid}: ${e}`);
  }
}

async function incrementPublicTypingStats(started, completed, time) {
  /*
  try {
    time = roundTo2(time);
    db.collection("public")
      .doc("stats")
      .update({
        completedTests: admin.firestore.FieldValue.increment(completed),
        startedTests: admin.firestore.FieldValue.increment(started),
        timeTyping: admin.firestore.FieldValue.increment(time),
      });
  } catch (e) {
    console.error(`Error while incrementing public stats: ${e}`);
  }
  */
}

function isTagPresetNameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 16) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

function isUsernameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (/miodec/.test(name.toLowerCase())) return false;
  if (/bitly/.test(name.toLowerCase())) return false;
  if (name.length > 14) return false;
  if (/^\..*/.test(name.toLowerCase())) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

// API

app.get("/api/nameCheck/:name", (req, res) => {
  if (!isUsernameValid(req.params.name)) {
    res.status(200).send({
      resultCode: -2,
      message: "Username is not valid",
    });
    return;
  }
  User.findOne({ name: req.params.name }, (err, user) => {
    console.log(err);
    if (user) {
      res.status(200).send({
        resultCode: -1,
        message: "Username is taken",
      });
      return;
    } else {
      res.status(200).send({
        resultCode: 1,
        message: "Username is available",
      });
      return;
    }
  }).catch(() => {
    res.status(200).send({
      resultCode: -1,
      message: "Error when checking for names",
    });
  });
});

app.post("/api/signUp", (req, res) => {
  const newuser = new User({
    name: req.body.name,
    email: req.body.email,
    uid: req.body.uid,
  });
  newuser.save();
  res.status(200);
  res.json({ user: newuser });
  return;
});

app.post("/api/updateName", (req, res) => {
  //this might be a put/patch request
  //update the name of user with given uid
  const uid = req.body.uid;
  const name = req.body.name;
});

app.post("/api/passwordReset", (req, res) => {
  const email = req.body.email;
  //send email to the passed email requesting password reset
  res.sendStatus(200);
});

app.get("/api/fetchSnapshot", authenticateToken, (req, res) => {
  /* Takes token and returns snap */
  User.findOne({ uid: req.uid }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    if (!user) res.status(200).send({ message: "No user found" }); //client doesn't do anything with this
    //populate snap object with data from user document
    let snap = user;
    //return user data
    res.send({ snap: snap });
    return;
  });
});

function stdDev(array) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}

app.post("/api/testCompleted", authenticateToken, (req, res) => {
  User.findOne({ uid: req.uid }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    request = req.body;
    if (request === undefined) {
      res.status(200).send({ resultCode: -999 });
      return;
    }
    try {
      if (req.uid === undefined || request.obj === undefined) {
        console.error(`error saving result for - missing input`);
        res.status(200).send({ resultCode: -999 });
        return;
      }

      let obj = request.obj;

      if (obj.incompleteTestSeconds > 500)
        console.log(
          `FUCK, HIGH INCOMPLETE TEST SECONDS ${req.uid}: ${JSON.stringify(
            obj
          )}`
        );

      function verifyValue(val) {
        let errCount = 0;
        if (val === null || val === undefined) {
        } else if (Array.isArray(val)) {
          //array
          val.forEach((val2) => {
            errCount += verifyValue(val2);
          });
        } else if (typeof val === "object" && !Array.isArray(val)) {
          //object
          Object.keys(val).forEach((valkey) => {
            errCount += verifyValue(val[valkey]);
          });
        } else {
          if (!/^[0-9a-zA-Z._\-\+]+$/.test(val)) errCount++;
        }
        return errCount;
      }
      let errCount = verifyValue(obj);
      if (errCount > 0) {
        console.error(
          `error saving result for ${
            req.uid
          } error count ${errCount} - bad input - ${JSON.stringify(
            request.obj
          )}`
        );
        res.status(200).send({ resultCode: -1 });
        return;
      }

      if (
        obj.wpm <= 0 ||
        obj.wpm > 350 ||
        obj.acc < 50 ||
        obj.acc > 100 ||
        obj.consistency > 100
      ) {
        res.status(200).send({ resultCode: -1 });
        return;
      }
      if (
        (obj.mode === "time" && obj.mode2 < 15 && obj.mode2 > 0) ||
        (obj.mode === "time" && obj.mode2 == 0 && obj.testDuration < 15) ||
        (obj.mode === "words" && obj.mode2 < 10 && obj.mode2 > 0) ||
        (obj.mode === "words" && obj.mode2 == 0 && obj.testDuration < 15) ||
        (obj.mode === "custom" &&
          obj.customText !== undefined &&
          !obj.customText.isWordRandom &&
          !obj.customText.isTimeRandom &&
          obj.customText.textLen < 10) ||
        (obj.mode === "custom" &&
          obj.customText !== undefined &&
          obj.customText.isWordRandom &&
          !obj.customText.isTimeRandom &&
          obj.customText.word < 10) ||
        (obj.mode === "custom" &&
          obj.customText !== undefined &&
          !obj.customText.isWordRandom &&
          obj.customText.isTimeRandom &&
          obj.customText.time < 15)
      ) {
        res.status(200).send({ resultCode: -5, message: "Test too short" });
        return;
      }
      if (!validateResult(obj)) {
        if (
          obj.bailedOut &&
          ((obj.mode === "time" && obj.mode2 >= 3600) ||
            (obj.mode === "words" && obj.mode2 >= 5000) ||
            obj.mode === "custom")
        ) {
          //dont give an error
        } else {
          res.status(200).send({ resultCode: -4 });
          return;
        }
      }

      let keySpacing = null;
      let keyDuration = null;
      try {
        keySpacing = {
          average:
            obj.keySpacing.reduce(
              (previous, current) => (current += previous)
            ) / obj.keySpacing.length,
          sd: stdDev(obj.keySpacing),
        };

        keyDuration = {
          average:
            obj.keyDuration.reduce(
              (previous, current) => (current += previous)
            ) / obj.keyDuration.length,
          sd: stdDev(obj.keyDuration),
        };
      } catch (e) {
        console.error(
          `cant verify key spacing or duration for user ${req.uid}! - ${e} - ${obj.keySpacing} ${obj.keyDuration}`
        );
      }

      obj.keySpacingStats = keySpacing;
      obj.keyDurationStats = keyDuration;

      if (obj.mode == "time" && (obj.mode2 == 15 || obj.mode2 == 60)) {
      } else {
        obj.keySpacing = "removed";
        obj.keyDuration = "removed";
      }

      // emailVerified = await admin
      //   .auth()
      //   .getUser(req.uid)
      //   .then((user) => {
      //     return user.emailVerified;
      //   });
      // emailVerified = true;

      // if (obj.funbox === "nospace") {
      //   res.status(200).send({ data: { resultCode: -1 } });
      //   return;
      // }
      //user.results.push()
      let userdata = user;
      let name = userdata.name === undefined ? false : userdata.name;
      let banned = userdata.banned === undefined ? false : userdata.banned;
      let verified = userdata.verified;
      request.obj.name = name;

      //check keyspacing and duration here
      if (obj.mode === "time" && obj.wpm > 130 && obj.testDuration < 122) {
        if (verified === false || verified === undefined) {
          if (keySpacing !== null && keyDuration !== null) {
            if (
              keySpacing.sd <= 15 ||
              keyDuration.sd <= 10 ||
              keyDuration.average < 15 ||
              (obj.wpm > 200 && obj.consistency < 70)
            ) {
              console.error(
                `possible bot detected by user (${obj.wpm} ${obj.rawWpm} ${
                  obj.acc
                }) ${req.name} ${name} - spacing ${JSON.stringify(
                  keySpacing
                )} duration ${JSON.stringify(keyDuration)}`
              );
              res.status(200).send({ resultCode: -2 });
              return;
            }
            if (
              (keySpacing.sd > 15 && keySpacing.sd <= 25) ||
              (keyDuration.sd > 10 && keyDuration.sd <= 15) ||
              (keyDuration.average > 15 && keyDuration.average <= 20)
            ) {
              console.error(
                `very close to bot detected threshold by user (${obj.wpm} ${
                  obj.rawWpm
                } ${obj.acc}) ${req.uid} ${name} - spacing ${JSON.stringify(
                  keySpacing
                )} duration ${JSON.stringify(keyDuration)}`
              );
            }
          } else {
            res.status(200).send({ resultCode: -3 });
            return;
          }
        }
      }

      //yeet the key data
      obj.keySpacing = null;
      obj.keyDuration = null;
      try {
        obj.keyDurationStats.average = roundTo2(obj.keyDurationStats.average);
        obj.keyDurationStats.sd = roundTo2(obj.keyDurationStats.sd);
        obj.keySpacingStats.average = roundTo2(obj.keySpacingStats.average);
        obj.keySpacingStats.sd = roundTo2(obj.keySpacingStats.sd);
      } catch (e) {}

      // return db
      //   .collection(`users/${req.uid}/results`)
      //   .add(obj)
      //   .then((e) => {

      // let createdDocId = e.id;
      return Promise.all([
        // checkLeaderboards(
        //   request.obj,
        //   "global",
        //   banned,
        //   name,
        //   verified,
        //   emailVerified
        // ),
        // checkLeaderboards(
        //   request.obj,
        //   "daily",
        //   banned,
        //   name,
        //   verified,
        //   emailVerified
        // ),
        checkIfPB(request.obj, userdata),
        checkIfTagPB(request.obj, userdata),
      ])
        .then(async (values) => {
          // let globallb = values[0].insertedAt;
          // let dailylb = values[1].insertedAt;
          let ispb = values[0];
          let tagPbs = values[1];
          // console.log(values);

          if (obj.mode === "time" && String(obj.mode2) === "60") {
            incrementT60Bananas(req.uid, obj, userdata);
          }

          await incrementGlobalTypingStats(userdata, obj);

          let returnobj = {
            resultCode: null,
            // globalLeaderboard: globallb,
            // dailyLeaderboard: dailylb,
            // lbBanned: banned,
            name: name,
            needsToVerify: values[0].needsToVerify,
            needsToVerifyEmail: values[0].needsToVerifyEmail,
            tagPbs: tagPbs,
          };
          if (ispb) {
            let logobj = request.obj;
            logobj.keySpacing = "removed";
            logobj.keyDuration = "removed";
            console.log(
              `saved result for ${req.uid} (new PB) - ${JSON.stringify(logobj)}`
            );
            /*
            User.findOne({ name: userdata.name }, (err, user2) => {
              console.log(user2.results[user2.results.length-1])
              console.log(user2.results[user2.results.length-1]).isPb
              user2.results[user2.results.length-1].isPb = true;
              user2.save();
            })
            */
            request.obj.isPb = true;
            if (
              obj.mode === "time" &&
              String(obj.mode2) === "60" &&
              userdata.discordId !== null &&
              userdata.discordId !== undefined
            ) {
              if (verified !== false) {
                console.log(
                  `sending command to the bot to update the role for user ${req.uid} with wpm ${obj.wpm}`
                );
                updateDiscordRole(userdata.discordId, Math.round(obj.wpm));
              }
            }
            returnobj.resultCode = 2;
          } else {
            let logobj = request.obj;
            logobj.keySpacing = "removed";
            logobj.keyDuration = "removed";
            request.obj.isPb = false;
            console.log(
              `saved result for ${req.uid} - ${JSON.stringify(logobj)}`
            );
            returnobj.resultCode = 1;
          }
          stripAndSave(req.uid, request.obj);
          res.status(200).send(returnobj);
          return;
        })
        .catch((e) => {
          console.error(
            `error saving result when checking for PB / checking leaderboards for ${req.uid} - ${e.message}`
          );
          res
            .status(200)
            .send({ data: { resultCode: -999, message: e.message } });
          return;
        });
    } catch (e) {
      console.error(
        `error saving result for ${req.uid} - ${JSON.stringify(
          request.obj
        )} - ${e}`
      );
      res.status(200).send({ resultCode: -999, message: e.message });
      return;
    }
  });
});

app.get("/api/userResults", authenticateToken, (req, res) => {
  User.findOne({ uid: req.uid }, (err, user) => {
    if (err) res.status(500).send({ error: err });
  });
  //return list of results
  res.sendStatus(200);
});

function isConfigKeyValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 30) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

app.post("/api/saveConfig", authenticateToken, (req, res) => {
  try {
    if (req.uid === undefined || req.body.obj === undefined) {
      console.error(`error saving config for ${req.uid} - missing input`);
      res.send({
        resultCode: -1,
        message: "Missing input",
      });
    }

    let obj = req.body.obj;
    let errorMessage = "";
    let err = false;
    Object.keys(obj).forEach((key) => {
      if (err) return;
      if (!isConfigKeyValid(key)) {
        err = true;
        console.error(`${key} failed regex check`);
        errorMessage = `${key} failed regex check`;
      }
      if (err) return;
      if (key === "resultFilters") return;
      if (key === "customBackground") return;
      let val = obj[key];
      if (Array.isArray(val)) {
        val.forEach((valarr) => {
          if (!isConfigKeyValid(valarr)) {
            err = true;
            console.error(`${key}: ${valarr} failed regex check`);
            errorMessage = `${key}: ${valarr} failed regex check`;
          }
        });
      } else {
        if (!isConfigKeyValid(val)) {
          err = true;
          console.error(`${key}: ${val} failed regex check`);
          errorMessage = `${key}: ${val} failed regex check`;
        }
      }
    });
    if (err) {
      console.error(
        `error saving config for ${req.uid} - bad input - ${JSON.stringify(
          request.obj
        )}`
      );
      res.send({
        resultCode: -1,
        message: "Bad input. " + errorMessage,
      });
    }

    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      user.config = obj;
      //what does {merge: true} do in firebase
      user.save();
    })
      .then(() => {
        res.send({
          resultCode: 1,
          message: "Saved",
        });
      })
      .catch((e) => {
        console.error(
          `error saving config to DB for ${req.uid} - ${e.message}`
        );
        res.send({
          resultCode: -1,
          message: e.message,
        });
      });
  } catch (e) {
    console.error(`error saving config for ${req.uid} - ${e}`);
    res.send({
      resultCode: -999,
      message: e,
    });
  }
});

app.post("/api/addPreset", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.obj.name)) {
      return { resultCode: -1 };
    } else if (req.uid === undefined || req.body.obj === undefined) {
      console.error(`error saving config for ${req.uid} - missing input`);
      res.json({
        resultCode: -1,
        message: "Missing input",
      });
    } else {
      let config = req.body.obj.config;
      let errorMessage = "";
      let err = false;
      Object.keys(config).forEach((key) => {
        if (err) return;
        if (!isConfigKeyValid(key)) {
          err = true;
          console.error(`${key} failed regex check`);
          errorMessage = `${key} failed regex check`;
        }
        if (err) return;
        if (key === "resultFilters") return;
        if (key === "customBackground") return;
        let val = config[key];
        if (Array.isArray(val)) {
          val.forEach((valarr) => {
            if (!isConfigKeyValid(valarr)) {
              err = true;
              console.error(`${key}: ${valarr} failed regex check`);
              errorMessage = `${key}: ${valarr} failed regex check`;
            }
          });
        } else {
          if (!isConfigKeyValid(val)) {
            err = true;
            console.error(`${key}: ${val} failed regex check`);
            errorMessage = `${key}: ${val} failed regex check`;
          }
        }
      });
      if (err) {
        console.error(
          `error adding preset for ${req.uid} - bad input - ${JSON.stringify(
            req.body.obj
          )}`
        );
        res.json({
          resultCode: -1,
          message: "Bad input. " + errorMessage,
        });
      }

      User.findOne({ uid: req.uid }, (err, user) => {
        if (user.presets.length >= 10) {
          res.json({
            resultCode: -2,
            message: "Preset limit",
          });
        } else {
          user.presets.push(req.body.obj);
          user.save();
        }
      })
        .then((updatedUser) => {
          User.findOne({ uid: req.uid }, (err, user) => {
            res.json({
              resultCode: 1,
              message: "Saved",
              id: user.presets[user.presets.length - 1]._id,
            });
          });
        })
        .catch((e) => {
          console.error(
            `error adding preset to DB for ${req.uid} - ${e.message}`
          );
          res.json({
            resultCode: -1,
            message: e.message,
          });
        });
    }
  } catch (e) {
    console.error(`error adding preset for ${req.uid} - ${e}`);
    res.json({
      resultCode: -999,
      message: e,
    });
  }
});

app.post("/api/editPreset", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.presetName)) {
      res.json({ resultCode: -1 });
    } else {
      User.findOne({ uid: req.uid }, (err, user) => {
        for (i = 0; i < user.presets.length; i++) {
          if (user.presets[i]._id.toString() == req.body.presetid.toString()) {
            user.presets[i] = {
              config: req.body.config,
              name: req.body.presetName,
            };
            break;
          }
        }
        user.save();
      })
        .then((e) => {
          console.log(
            `user ${req.uid} updated a preset: ${req.body.presetName}`
          );
          res.json({
            resultCode: 1,
          });
        })
        .catch((e) => {
          console.error(
            `error while updating preset for user ${req.uid}: ${e.message}`
          );
          res.json({ resultCode: -999, message: e.message });
        });
    }
  } catch (e) {
    console.error(`error updating preset for ${req.uid} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/api/removePreset", authenticateToken, (req, res) => {
  try {
    User.findOne({ uid: req.uid }, (err, user) => {
      for (i = 0; i < user.presets.length; i++) {
        if (user.presets[i]._id.toString() == req.body.presetid.toString()) {
          user.presets.splice(i, 1);
          break;
        }
      }
      user.save();
    })
      .then((e) => {
        console.log(`user ${req.uid} deleted a preset`);
        res.send({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(
          `error deleting preset for user ${req.uid}: ${e.message}`
        );
        res.send({ resultCode: -999 });
      });
  } catch (e) {
    console.error(`error deleting preset for ${req.uid} - ${e}`);
    res.send({ resultCode: -999 });
  }
});

function isTagPresetNameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 16) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

//could use /api/tags/add instead
app.post("/api/addTag", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.tagName)) return { resultCode: -1 };
    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      if (user.tags.includes(req.body.tagName)) {
        return { resultCode: -999, message: "Duplicate tag" };
      }
      const tagObj = { name: req.body.tagName };
      user.tags.push(tagObj);
      user.save();
    })
      .then(() => {
        console.log(`user ${req.uid} created a tag: ${req.body.tagName}`);
        let newTagId;
        User.findOne({ uid: req.uid }, (err, user) => {
          newTagId = user.tags[user.tags.length - 1]._id;
        }).then(() => {
          res.json({
            resultCode: 1,
            id: newTagId,
          });
        });
      })
      .catch((e) => {
        console.error(
          `error while creating tag for user ${req.uid}: ${e.message}`
        );
        res.json({ resultCode: -999, message: e.message });
      });
  } catch (e) {
    console.error(`error adding tag for ${req.uid} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/api/editTag", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.tagName)) return { resultCode: -1 };
    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      for (var i = 0; i < user.tags.length; i++) {
        if (user.tags[i]._id == req.body.tagId) {
          user.tags[i].name = req.body.tagName;
        }
      }
      user.save();
    })
      .then((updatedUser) => {
        console.log(`user ${req.uid} updated a tag: ${req.body.tagName}`);
        res.json({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(
          `error while updating tag for user ${req.uid}: ${e.message}`
        );
        res.json({ resultCode: -999, message: e.message });
      });
  } catch (e) {
    console.error(`error updating tag for ${req.uid} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/api/removeTag", authenticateToken, (req, res) => {
  try {
    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      for (var i = 0; i < user.tags.length; i++) {
        if (user.tags[i]._id == req.body.tagId) {
          user.tags.splice(i, 1);
        }
      }
      user.save();
    })
      .then((updatedUser) => {
        console.log(`user ${req.uid} deleted a tag`);
        res.json({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(`error deleting tag for user ${req.uid}: ${e.message}`);
        res.json({ resultCode: -999 });
      });
  } catch (e) {
    console.error(`error deleting tag for ${req.uid} - ${e}`);
    res.json({ resultCode: -999 });
  }
});

app.post("/api/resetPersonalBests", authenticateToken, (req, res) => {
  try {
    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      user.personalBests = {};
      user.save();
    });
    res.status(200).send({ status: "Reset Pbs successfully" });
  } catch (e) {
    console.log(
      `something went wrong when deleting personal bests for ${uid}: ${e.message}`
    );
    res.status(500).send({ status: "Reset Pbs successfully" });
  }
});

function addToLeaderboard(lb, result, username) {
  //insertedAt is index of array inserted position, 1 is added after
  retData = { insertedAt: -1 };
  //check for duplicate user
  for (i = 0; i < lb.board.length; i++) {
    if (lb.board[i].name == username) {
      if (lb.board[i].wpm <= result.wpm) {
        //delete old entry if speed is faster this time
        lb.board.splice(i, 1);
        retData.foundAt = i + 1;
        retData.newBest = true;
      } else {
        //don't add new entry if slower than last time
        return lb, { insertedAt: -1, foundAt: i + 1 };
      }
    }
  }
  //when is newBest not true?
  retData.newBest = true;
  if (!retData.foundAt) retData.foundAt = -1;
  //determine if the entry should be hidden

  //add item to leaderboard
  const lbitem = {
    name: username,
    wpm: result.wpm,
    raw: result.rawWpm,
    acc: result.acc,
    consistency: result.consistency,
    mode: result.mode,
    mode2: result.mode2,
    timestamp: Date.now(),
    hidden: false,
  };
  if (lb.board.length == 0) {
    console.log("adding to first position");
    lb.board.push(lbitem);
    retData.insertedAt = 0;
  } else if (lbitem.wpm < lb.board.slice(-1)[0].wpm) {
    console.log("adding to the end");
    console.log(lb.board.slice(-1)[0].wpm);
    lb.board.push(lbitem);
    retData.insertedAt = lb.board.length - 1;
  } else {
    console.log("searching for addition spot");
    for (i = 0; i < lb.board.length; i++) {
      //start from top, if item wpm > lb item wpm, insert before it
      if (lbitem.wpm >= lb.board[i].wpm) {
        console.log("adding to daily lb position " + i);
        lb.board.splice(i, 0, lbitem);
        retData.insertedAt = i;
        break;
      }
    }
    if (lb.board.length > lb.size) {
      lb.pop();
    }
  }
  return lb, retData;
}

app.post("/api/attemptAddToLeaderboards", authenticateToken, (req, res) => {
  const result = req.body.result;
  let retData = {};
  User.findOne({ uid: req.uid }, (err, user) => {
    admin
      .auth()
      .getUser(req.uid)
      .then((fbUser) => {
        return fbUser.emailVerified;
      })
      .then((emailVerified) => {
        if (user.emailVerified === false) {
          if (emailVerified === true) {
            user.emailVerified = true;
          } else {
            res.status(200).send({ needsToVerifyEmail: true });
            return;
          }
        }
        if (user.name === undefined) {
          //cannot occur since name is required, why is this here?
          res.status(200).send({ noName: true });
          return;
        }
        if (user.banned) {
          res.status(200).send({ banned: true });
          return;
        }
        /*
      if (user.verified === false) {
        res.status(200).send({ needsToVerify: true });
        return;
      }*/
        Leaderboard.find(
          {
            mode: result.mode,
            mode2: result.mode2,
          },
          (err, lbs) => {
            //for all leaderboards queried, determine if it qualifies, and add if it does
            lbs.forEach((lb) => {
              if (
                lb.board.length == 0 ||
                lb.board.length < lb.size ||
                result.wpm > lb.board.slice(-1)[0].wpm
              ) {
                lb, (lbPosData = addToLeaderboard(lb, result, user.name)); //should uid be added instead of name?
                console.log(user.lbMemory[lb.mode + lb.mode2][lb.type]);
                //lbPosData.foundAt = user.lbMemory[lb.mode+lb.mode2][lb.type];
                retData[lb.type] = lbPosData;
                lb.save();
                user.lbMemory[lb.mode + lb.mode2][lb.type] =
                  retData[lb.type].insertedAt;
              }
            });
          }
        ).then((e) => {
          retData.status = 2;
          user.save();
          res.json(retData);
        });
      });
  });
  res.status(200);
});

app.get("/api/getLeaderboard/:type/:mode/:mode2", (req, res) => {
  Leaderboard.findOne(
    { mode: req.params.mode, mode2: req.params.mode2, type: req.params.type },
    (err, lb) => {
      res.send(lb);
    }
  );
});

// LISTENER
app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
