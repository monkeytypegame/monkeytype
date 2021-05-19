require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { User } = require("./usermodel");

// MIDDLEWARE &  SETUP

const app = express();
const { Schema } = mongoose;

const port = process.env.PORT || "5000";

//let dbConn = mongodb.MongoClient.connect('mongodb://localhost:27017/monkeytype');
mongoose.connect("mongodb://localhost:27017/monkeytype", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.static(__dirname + "/dist"));
app.use(bodyParser.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, identity) => {
    if (err) return res.sendStatus(403);
    req.name = identity.name;
    next();
  });
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

async function checkIfPB(uid, obj, userdata) {
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
    User.findOne({ _id: uid }, (err, user) => {
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
    User.findOne({ _id: uid }, (err, user) => {
      user.personalBests = pbs;
      user.save();
    });
    return true;
  } else {
    return false;
  }
}

async function checkIfTagPB(uid, obj, userdata) {
  //Add functionality before release
  return true;
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

  await User.findOne({ _id: uid }, (err, user) => {
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
      User.findOne({ _id: uid }, (err, user) => {
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
    User.findOne({ name: userData.name }, (err, user) => {
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
  //maybe this should be added to analytics
  //analytics should be able to track usage over time and show a graph
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

// API

app.post("/api/updateName", (req, res) => {
  //this might be a put/patch request
  //update the name of user with given uid
  const uid = req.body.uid;
  const name = req.body.name;
});

app.post("/api/sendEmailVerification", (req, res) => {
  const uid = req.body.uid;
  //Add send Email verification code here
  //should be a seperate sendEmailVerification function that can be called from sign up as well
  res.sendStatus(200);
});

app.post("/api/signIn", (req, res) => {
  /* Takes email and password */
  //Login and send tokens
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    if (user == null) {
      res.status(500).send({ error: "No user found with that email" });
    }
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (err)
        res.status(500).send({ error: "Error during password validation" });
      if (result) {
        //if password matches hash
        const accessToken = jwt.sign(
          { name: user.name },
          process.env.ACCESS_TOKEN_SECRET
        );
        const refreshToken = jwt.sign(
          { name: user.name },
          process.env.REFRESH_TOKEN_SECRET
        );
        user.refreshTokens.push(refreshToken);
        user.save();
        const retUser = {
          uid: user._id,
          displayName: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          metadata: { creationTime: user.createdAt },
        };
        res.json({
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: retUser,
        });
      } else {
        //if password doesn't match hash
        res.status(500).send({ error: "Password invalid" });
      }
    });
  });
});

app.post("/api/signUp", (req, res) => {
  /* Takes name, email, password */
  //check if name has been taken
  User.exists({ name: req.body.name }).then((exists) => {
    //should also check if email is used
    if (exists) {
      //user with that name already exists
      res.status(500).send({ error: "Username taken" });
    }
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      if (err) console.log(err);
      const newuser = new User({
        name: req.body.name,
        email: req.body.email,
        emailVerified: false,
        password: hash,
      });
      newuser
        .save()
        .then((user) => {
          //send email verification

          //add account created event to analytics

          //return user data and access token
          const accessToken = jwt.sign(
            { name: req.body.name },
            process.env.ACCESS_TOKEN_SECRET
          );
          const refreshToken = jwt.sign(
            { name: user.name },
            process.env.REFRESH_TOKEN_SECRET
          );
          user.refreshTokens.push(refreshToken);
          user.save();
          const retUser = {
            uid: user._id,
            displayName: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            metadata: { creationTime: user.createdAt },
          };
          res.json({
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: retUser,
          });
        })
        .catch((e) => {
          console.log(e);
          res.status(500).send({ error: "Error when adding user" });
        });
    });
  });
});

app.post("/api/refreshToken", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, identity) => {
    if (err) return res.sendStatus(403);
    User.findOne({ name: identity.name }, (err, user) => {
      if (!user.refreshTokens.includes(token)) return res.sendStatus(403);
      const accessToken = jwt.sign(
        { name: identity.name },
        process.env.ACCESS_TOKEN_SECRET
      );
      res.json({ accessToken: accessToken });
    });
  });
});

app.post("/api/passwordReset", (req, res) => {
  const email = req.body.email;
  //send email to the passed email requesting password reset
  res.sendStatus(200);
});

app.get("/api/fetchSnapshot", authenticateToken, (req, res) => {
  /* Takes token and returns snap */
  User.findOne({ name: req.name }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    //populate snap object with data from user document
    let snap = user;
    delete snap.password;
    //return user data
    res.json({ snap: snap });
  });
});

app.post("/api/testCompleted", authenticateToken, (req, res) => {
  //return createdId
  //return user data
  //this is actually REALLY hard
  User.findOne({ name: req.name }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    request = req.body;
    request.uid = user._id;
    if (request === undefined) {
      res.status(200).send({ data: { resultCode: -999 } });
      return;
    }
    try {
      if (request.uid === undefined || request.obj === undefined) {
        console.error(`error saving result for - missing input`);
        res.status(200).send({ data: { resultCode: -999 } });
        return;
      }

      let obj = request.obj;

      if (obj.incompleteTestSeconds > 500)
        console.log(
          `FUCK, HIGH INCOMPLETE TEST SECONDS ${request.uid}: ${JSON.stringify(
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
            request.uid
          } error count ${errCount} - bad input - ${JSON.stringify(
            request.obj
          )}`
        );
        res.status(200).send({ data: { resultCode: -1 } });
        return;
      }

      if (
        obj.wpm <= 0 ||
        obj.wpm > 350 ||
        obj.acc < 50 ||
        obj.acc > 100 ||
        obj.consistency > 100
      ) {
        res.status(200).send({ data: { resultCode: -1 } });
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
        res
          .status(200)
          .send({ data: { resultCode: -5, message: "Test too short" } });
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
          res.status(200).send({ data: { resultCode: -4 } });
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
          `cant verify key spacing or duration for user ${request.uid}! - ${e} - ${obj.keySpacing} ${obj.keyDuration}`
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
      //   .getUser(request.uid)
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
                }) ${request.uid} ${name} - spacing ${JSON.stringify(
                  keySpacing
                )} duration ${JSON.stringify(keyDuration)}`
              );
              res.status(200).send({ data: { resultCode: -2 } });
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
                } ${obj.acc}) ${request.uid} ${name} - spacing ${JSON.stringify(
                  keySpacing
                )} duration ${JSON.stringify(keyDuration)}`
              );
            }
          } else {
            res.status(200).send({ data: { resultCode: -3 } });
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
      //   .collection(`users/${request.uid}/results`)
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
        checkIfPB(request.uid, request.obj, userdata),
        checkIfTagPB(request.uid, request.obj),
      ])
        .then(async (values) => {
          // let globallb = values[0].insertedAt;
          // let dailylb = values[1].insertedAt;
          let ispb = values[0];
          let tagPbs = values[1];
          // console.log(values);

          if (obj.mode === "time" && String(obj.mode2) === "60") {
            incrementT60Bananas(request.uid, obj, userdata);
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
              `saved result for ${request.uid} (new PB) - ${JSON.stringify(
                logobj
              )}`
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
                  `sending command to the bot to update the role for user ${request.uid} with wpm ${obj.wpm}`
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
              `saved result for ${request.uid} - ${JSON.stringify(logobj)}`
            );
            returnobj.resultCode = 1;
          }
          stripAndSave(request.uid, request.obj);
          res.status(200).send({ data: returnobj });
          return;
        })
        .catch((e) => {
          console.error(
            `error saving result when checking for PB / checking leaderboards for ${request.uid} - ${e.message}`
          );
          res
            .status(200)
            .send({ data: { resultCode: -999, message: e.message } });
          return;
        });
    } catch (e) {
      console.error(
        `error saving result for ${request.uid} - ${JSON.stringify(
          request.obj
        )} - ${e}`
      );
      res.status(200).send({ data: { resultCode: -999, message: e.message } });
      return;
    }
  });
});

app.get("/api/userResults", authenticateToken, (req, res) => {
  User.findOne({ name: req.name }, (err, user) => {
    if (err) res.status(500).send({ error: err });
  });
  //return list of results
  res.sendStatus(200);
});

app.post("/api/saveConfig", (req, res) => {
  const config = req.body.config;
  //parse config object to prevent errors
  //save passed config object to database
});

// ANALYTICS API

function newAnalyticsEvent() {}
app.post("/api/analytics/usedCommandLine", (req, res) => {
  //save command used from command line to analytics
  const command = req.body.command;
  res.sendStatus(200);
});

app.post("/api/analytics/changedLanguage", (req, res) => {
  //save what a user changed their language to
  const language = req.body.language;
  res.sendStatus(200);
});

app.post("/api/analytics/changedTheme", (req, res) => {
  //save what a user changed their theme to
  const theme = req.body.theme;
  res.sendStatus(200);
});

app.post("/api/analytics/testStarted", (req, res) => {
  //log that a test was started
  res.sendStatus(200);
});

app.post("/api/analytics/testStartedNoLogin", (req, res) => {
  //log that a test was started without login
  res.sendStatus(200);
});

app.post("/api/analytics/testCompleted", (req, res) => {
  //log that a test was completed
  const completedEvent = req.body.completedEvent;
  res.sendStatus(200);
});

app.post("/api/analytics/testCompletedNoLogin", (req, res) => {
  //log that a test was completed and user was not logged in
  const completedEvent = req.body.completedEvent;
  res.sendStatus(200);
});

app.post("/api/analytics/testCompletedInvalid", (req, res) => {
  //log that a test was completed and is invalid
  const completedEvent = req.body.completedEvent;
  res.sendStatus(200);
});

// STATIC FILES
app.get("/privacy-policy", (req, res) => {
  res.sendFile(__dirname + "/dist/privacy-policy.html");
});

app.use((req, res, next) => {
  //sends index.html if the route is not found above
  res.sendFile(__dirname + "/dist/index.html");
});

// LISTENER
app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
