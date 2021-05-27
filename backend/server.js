require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { User } = require("./models/user");
const { Analytics } = require("./models/analytics");
const { Leaderboard } = require("./models/leaderboard");

// MIDDLEWARE &  SETUP

const app = express();

const port = process.env.PORT || "5000";

mongoose.connect("mongodb://localhost:27017/monkeytype", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    //should use OAuth in production
    //type: 'OAuth2',
    user: process.env.MAIL_ADDRESS,
    pass: process.env.MAIL_PASSWORD,
    //clientId: process.env.OAUTH_CLIENTID,
    //clientSecret: process.env.OAUTH_CLIENT_SECRET,
    //refreshToken: process.env.OAUTH_REFRESH_TOKEN
  },
});

const mtRootDir = __dirname.substring(0, __dirname.length - 8); //will this work for windows and mac computers?
app.use(express.static(mtRootDir + "/dist"));
app.use(bodyParser.json());

// Daily leaderboard clear function
function clearDailyLeaderboards() {
  var nextClear = new Date();
  nextClear.setHours(24, 0, 0, 0); //next occurrence of 12am
  let currentTime = new Date();
  setTimeout(() => {
    Leaderboard.find({ type: "daily" }, (err, lbs) => {
      lbs.forEach((lb) => {
        lb.board = [];
        lb.resetTime = nextClear;
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
    User.findOne({ name: userdata.name }, (err, user) => {
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
    User.findOne({ name: userdata.name }, (err, user) => {
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
    await User.findOne({ name: userdata.name }, (err, user) => {
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
      console.log("PBs undefined");
      //undefined personal best = new personal best
      await User.findOne({ name: userdata.name }, (err, user) => {
        //it might be more convenient if tags was an object with ids as the keys
        for (let j = 0; j < user.tags.length; j++) {
          console.log(user.tags[j]);
          if (user.tags[j]._id.toString() == dbtags[i]._id.toString()) {
            user.tags[j].personalBests = {
              [obj.mode]: {
                [obj.mode2]: {
                  language: obj.language,
                  difficulty: obj.difficulty,
                  punctuation: obj.punctuation,
                  wpm: obj.wpm,
                  acc: obj.acc,
                  raw: obj.rawWpm,
                  timestamp: Date.now(),
                  consistency: obj.consistency,
                },
              },
            };
          }
          pbs = user.tags[j].personalBests;
        }
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
        console.log("Semi-new pb");
        pbs[obj.mode][obj.mode2] = {
          language: obj.language,
          difficulty: obj.difficulty,
          punctuation: obj.punctuation,
          wpm: obj.wpm,
          acc: obj.acc,
          raw: obj.rawWpm,
          timestamp: Date.now(),
          consistency: obj.consistency,
        };
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
      console.log("Adding new pb at end");
      await User.findOne({ name: userdata.name }, (err, user) => {
        //it might be more convenient if tags was an object with ids as the keys
        for (let j = 0; j < user.tags.length; j++) {
          console.log(user.tags[j]);
          console.log(dbtags[i]);
          if (user.tags[j]._id.toString() === dbtags[i]._id.toString()) {
            console.log("Made it inside the if");
            user.tags[j].personalBests = dbtags[i].personalBests;
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

async function stripAndSave(username, obj) {
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

  await User.findOne({ name: username }, (err, user) => {
    user.results.push(obj);
    user.save();
  });
}

function incrementT60Bananas(username, result, userData) {
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
      User.findOne({ name: username }, (err, user) => {
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

function isTagPresetNameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 16) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

// API

app.post("/api/updateName", (req, res) => {
  //this might be a put/patch request
  //update the name of user with given uid
  const uid = req.body.uid;
  const name = req.body.name;
});

function sendVerificationEmail(username, email) {
  const host = "localhost:5000";
  const hash = Math.random().toString(16).substr(2, 12);
  const link = `http://${host}/verifyEmail?name=${username}&hash=${hash}`;
  User.findOne({ name: username }, (err, user) => {
    user.verificationHashes.push(hash);
    user.save();
  });
  const mailOptions = {
    from: process.env.MAIL_ADDRESS,
    to: email,
    subject: "Monkeytype User Verification",
    text: `Hello ${username},\nFollow this link to verify your email address:\n${link}\nIf you didn’t ask to verify this address, you can ignore this email.\nThanks,\nYour monkeytype team`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

app.get("/verifyEmail", (req, res) => {
  let success = false;
  User.findOne({ name: req.query.name }, (err, user) => {
    if (user.verificationHashes.includes(req.query.hash)) {
      success = true;
      user.verificationHashes = [];
      user.verified = true;
      user.emailVerified = true;
      user.save();
    }
  }).then(() => {
    if (success) {
      res.send(
        "<h3>Email verified successfully</h3><p>Go back to <a href='https://monkeytype.com'>monkeytype</a></p>"
      );
    } else {
      res.send(
        "<h3>Email verification failed</h3><p>Go back to <a href='https://monkeytype.com'>monkeytype</a></p>"
      );
    }
  });
});

app.post("/api/sendEmailVerification", authenticateToken, (req, res) => {
  User.findOne({ name: req.name }, (err, user) => {
    sendVerificationEmail(req.name, user.email);
  });
  res.sendStatus(200);
});

app.post("/api/signIn", (req, res) => {
  /* Takes email and password */
  //Login and send tokens
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    if (user === null) {
      res.status(500).send({ error: "No user found with that email" });
      return;
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
          name: user.name,
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
          sendVerificationEmail(user.name, user.email);
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
            name: user.name,
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
    res.send({ snap: snap });
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
  //return createdId
  //return user data
  //this is actually REALLY hard
  User.findOne({ name: req.name }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    request = req.body;
    if (request === undefined) {
      res.status(200).send({ data: { resultCode: -999 } });
      return;
    }
    try {
      if (req.name === undefined || request.obj === undefined) {
        console.error(`error saving result for - missing input`);
        res.status(200).send({ data: { resultCode: -999 } });
        return;
      }

      let obj = request.obj;

      if (obj.incompleteTestSeconds > 500)
        console.log(
          `FUCK, HIGH INCOMPLETE TEST SECONDS ${req.name}: ${JSON.stringify(
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
            req.name
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
          `cant verify key spacing or duration for user ${req.name}! - ${e} - ${obj.keySpacing} ${obj.keyDuration}`
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
      //   .getUser(req.name)
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
                } ${obj.acc}) ${req.name} ${name} - spacing ${JSON.stringify(
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
      //   .collection(`users/${req.name}/results`)
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
            incrementT60Bananas(req.name, obj, userdata);
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
              `saved result for ${req.name} (new PB) - ${JSON.stringify(
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
                  `sending command to the bot to update the role for user ${req.name} with wpm ${obj.wpm}`
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
              `saved result for ${req.name} - ${JSON.stringify(logobj)}`
            );
            returnobj.resultCode = 1;
          }
          stripAndSave(req.name, request.obj);
          res.status(200).send({ data: returnobj });
          return;
        })
        .catch((e) => {
          console.error(
            `error saving result when checking for PB / checking leaderboards for ${req.name} - ${e.message}`
          );
          res
            .status(200)
            .send({ data: { resultCode: -999, message: e.message } });
          return;
        });
    } catch (e) {
      console.error(
        `error saving result for ${req.name} - ${JSON.stringify(
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

function isConfigKeyValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 30) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

app.post("/api/saveConfig", authenticateToken, (req, res) => {
  try {
    if (req.name === undefined || req.body.obj === undefined) {
      console.error(`error saving config for ${req.name} - missing input`);
      return {
        resultCode: -1,
        message: "Missing input",
      };
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
        `error saving config for ${req.name} - bad input - ${JSON.stringify(
          request.obj
        )}`
      );
      return {
        resultCode: -1,
        message: "Bad input. " + errorMessage,
      };
    }

    User.findOne({ name: req.name }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      user.config = obj;
      //what does {merge: true} do in firebase
      user.save();
    })
      .then(() => {
        return {
          resultCode: 1,
          message: "Saved",
        };
      })
      .catch((e) => {
        console.error(
          `error saving config to DB for ${req.name} - ${e.message}`
        );
        return {
          resultCode: -1,
          message: e.message,
        };
      });
  } catch (e) {
    console.error(`error saving config for ${req.name} - ${e}`);
    return {
      resultCode: -999,
      message: e,
    };
  }
});

app.post("/api/addPreset", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.obj.name)) {
      return { resultCode: -1 };
    } else if (req.name === undefined || req.body.obj === undefined) {
      console.error(`error saving config for ${req.name} - missing input`);
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
          `error adding preset for ${req.name} - bad input - ${JSON.stringify(
            req.body.obj
          )}`
        );
        res.json({
          resultCode: -1,
          message: "Bad input. " + errorMessage,
        });
      }

      User.findOne({ name: req.name }, (err, user) => {
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
          res.json({
            resultCode: 1,
            message: "Saved",
            id: updatedUser.presets[updatedUser.presets.length - 1]._id,
          });
        })
        .catch((e) => {
          console.error(
            `error adding preset to DB for ${req.name} - ${e.message}`
          );
          res.json({
            resultCode: -1,
            message: e.message,
          });
        });
    }
  } catch (e) {
    console.error(`error adding preset for ${req.name} - ${e}`);
    res.json({
      resultCode: -999,
      message: e,
    });
  }
});

app.post("/api/editPreset", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.presetName)) {
      return { resultCode: -1 };
    } else {
      User.findOne({ name: req.name }, (err, user) => {
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
            `user ${req.name} updated a preset: ${req.body.presetName}`
          );
          res.send({
            resultCode: 1,
          });
        })
        .catch((e) => {
          console.error(
            `error while updating preset for user ${req.name}: ${e.message}`
          );
          res.send({ resultCode: -999, message: e.message });
        });
    }
  } catch (e) {
    console.error(`error updating preset for ${req.name} - ${e}`);
    return { resultCode: -999, message: e.message };
  }
});

app.post("/api/removePreset", authenticateToken, (req, res) => {
  try {
    User.findOne({ name: req.name }, (err, user) => {
      for (i = 0; i < user.presets.length; i++) {
        if (user.presets[i]._id.toString() == req.body.presetid.toString()) {
          user.presets.splice(i, 1);
          break;
        }
      }
      user.save();
    })
      .then((e) => {
        console.log(`user ${req.name} deleted a preset`);
        res.send({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(
          `error deleting preset for user ${req.name}: ${e.message}`
        );
        res.send({ resultCode: -999 });
      });
  } catch (e) {
    console.error(`error deleting preset for ${req.name} - ${e}`);
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
    User.findOne({ name: req.name }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      if (user.tags.includes(req.body.tagName)) {
        return { resultCode: -999, message: "Duplicate tag" };
      }
      const tagObj = { name: req.body.tagName };
      user.tags.push(tagObj);
      user.save();
    })
      .then((updatedUser) => {
        console.log(`user ${req.name} created a tag: ${req.body.tagName}`);
        res.json({
          resultCode: 1,
          id: updatedUser.tags[updatedUser.tags.length - 1]._id,
        });
      })
      .catch((e) => {
        console.error(
          `error while creating tag for user ${req.name}: ${e.message}`
        );
        res.json({ resultCode: -999, message: e.message });
      });
  } catch (e) {
    console.error(`error adding tag for ${req.name} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/api/editTag", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.tagName)) return { resultCode: -1 };
    User.findOne({ name: req.name }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      for (var i = 0; i < user.tags.length; i++) {
        if (user.tags[i]._id == req.body.tagId) {
          user.tags[i].name = req.body.tagName;
        }
      }
      user.save();
    })
      .then((updatedUser) => {
        console.log(`user ${req.name} updated a tag: ${req.name}`);
        res.json({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(
          `error while updating tag for user ${req.name}: ${e.message}`
        );
        res.json({ resultCode: -999, message: e.message });
      });
  } catch (e) {
    console.error(`error updating tag for ${req.name} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/api/removeTag", authenticateToken, (req, res) => {
  try {
    User.findOne({ name: req.name }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      for (var i = 0; i < user.tags.length; i++) {
        if (user.tags[i]._id == req.body.tagId) {
          user.tags.splice(i, 1);
        }
      }
      user.save();
    })
      .then((updatedUser) => {
        console.log(`user ${req.name} deleted a tag`);
        res.json({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(`error deleting tag for user ${req.name}: ${e.message}`);
        res.json({ resultCode: -999 });
      });
  } catch (e) {
    console.error(`error deleting tag for ${req.name} - ${e}`);
    res.json({ resultCode: -999 });
  }
});

app.post("/api/resetPersonalBests", authenticateToken, (req, res) => {
  try {
    User.findOne({ name: req.name }, (err, user) => {
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
  retData = {};
  //check for duplicate user
  for (i = 0; i < lb.board.length; i++) {
    if (lb.board[i].name == username) {
      if (lb.board[i].wpm <= result.wpm) {
        //delete old entry if speed is faster this time
        lb.board.splice(i, 1);
        retData.foundAt = i;
      } else {
        //don't add new entry if slower than last time
        return lb, { insertedAt: -1 };
      }
    }
  }
  if (!retData.foundAt) retData.foundAt = 0;
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
    lb.board.push(lbitem);
    retData.insertedAt = 1;
  } else if (lbitem.wpm < lb.board.slice(-1)[0].wpm) {
    lb.board.push(lbitem);
    retData.insertedAt = lb.board.length + 1;
  } else {
    for (i = 0; i < lb.board.length; i++) {
      //start from top, if item wpm > lb item wpm, insert before it
      if (lbitem.wpm >= lb.board[i].wpm) {
        console.log("adding to daily lb position " + i);
        lb.board.splice(i, 0, lbitem);
        retData.insertedAt = i + 1;
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
  //check daily first, if on daily, check global
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
          lb, (lbPosData = addToLeaderboard(lb, result, req.name));
          retData[lb.type] = lbPosData;
          lb.save();
        }
      });
    }
  ).then((e) => {
    retData.status = 2;
    res.json(retData);
  });
  res.status(200);
});

app.get("/api/getLeaderboard/:type/:mode/:mode2", (req, res) => {
  Leaderboard.findOne(
    { mode: req.params.mode, mode2: req.params.mode2, type: req.params.type },
    (err, lb) => {
      if (lb.type == "daily") {
        date = new Date();
        date.setDate(date.getDate() + 1);
        lb.resetTime = date;
      }
      res.send(lb);
    }
  );
});

// ANALYTICS API

function newAnalyticsEvent(event, data) {
  let newEvent = {
    event: event,
  };
  if (data) newEvent.data = data;
  const newEventObj = new Analytics(newEvent);
  newEventObj.save();
}

app.post("/api/analytics/usedCommandLine", (req, res) => {
  //save command used from command line to analytics
  newAnalyticsEvent("usedCommandLine", { command: req.body.command });
  res.sendStatus(200);
});

app.post("/api/analytics/changedLanguage", (req, res) => {
  //save what a user changed their language to
  newAnalyticsEvent("changedLanguage", { language: req.body.language });
  res.sendStatus(200);
});

app.post("/api/analytics/changedTheme", (req, res) => {
  //save what a user changed their theme to
  newAnalyticsEvent("changedTheme", { theme: req.body.theme });
  res.sendStatus(200);
});

app.post("/api/analytics/testStarted", (req, res) => {
  //log that a test was started
  newAnalyticsEvent("testStarted");
  res.sendStatus(200);
});

app.post("/api/analytics/testStartedNoLogin", (req, res) => {
  //log that a test was started without login
  newAnalyticsEvent("testStartedNoLogin");
  res.sendStatus(200);
});

app.post("/api/analytics/testCompleted", (req, res) => {
  //log that a test was completed
  newAnalyticsEvent("testCompleted", {
    completedEvent: req.body.completedEvent,
  });
  res.sendStatus(200);
});

app.post("/api/analytics/testCompletedNoLogin", (req, res) => {
  //log that a test was completed and user was not logged in
  newAnalyticsEvent("testCompletedNoLogin", {
    completedEvent: req.body.completedEvent,
  });
  res.sendStatus(200);
});

app.post("/api/analytics/testCompletedInvalid", (req, res) => {
  //log that a test was completed and is invalid
  newAnalyticsEvent("testCompletedInvalid", {
    completedEvent: req.body.completedEvent,
  });
  res.sendStatus(200);
});

// STATIC FILES
app.get("/privacy-policy", (req, res) => {
  res.sendFile(mtRootDir + "/dist/privacy-policy.html");
});

app.use((req, res, next) => {
  //sends index.html if the route is not found above
  res.sendFile(mtRootDir + "/dist/index.html");
});

// LISTENER
app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
