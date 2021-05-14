require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { User } = require("./models");

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

// API

app.get("/api/currentUser", authenticateToken, (req, res) => {
  User.findOne({ name: req.name }, (err, user) => {
    //user must have uid, displayName, email properties
    const retUser = {
      uid: user._id,
      displayName: user.name,
      email: user.email,
    };
    res.json({ user: retUser });
  });
});

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
        const retUser = {
          uid: user._id,
          displayName: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          metadata: { creationTime: user.createdAt },
        };
        res.json({ accessToken: accessToken, user: retUser });
      } else {
        //if password doesn't match hash
        res.status(500).send({ error: "Password invalid" });
      }
    });
  });
});

app.post("/api/signOut", (req, res) => {
  /* Takes user id and token? */
  //Logout user
  //This route isn't necessary for jwt authentication
  res.sendStatus(200);
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
          const retUser = {
            uid: user._id,
            displayName: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            metadata: { creationTime: user.createdAt },
          };
          res.json({ accessToken: accessToken, user: retUser });
        })
        .catch((e) => {
          console.log(e);
          res.status(500).send({ error: "Error when adding user" });
        });
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
  //this is called in init snapshot
  User.findOne({ name: req.name }, (err, user) => {
    if (err) res.status(500).send({ error: err });
    //populate snap object with data from user document
    let snap = user;
    delete snap.password;
    //return user data
    res.json({ snap: snap });
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

// CLOUD FUNCTIONS

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
