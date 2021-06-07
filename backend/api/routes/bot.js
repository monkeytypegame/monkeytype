async function botAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = await admin
    .auth()
    .verifyIdToken(req.headers.authorization.split(" ")[1]);
  if (token.isDiscordBot == null || token.isDiscordBot == false) {
    return res.sendStatus(401);
  } else {
    next();
  }
}

app.get("/getBananas/:discordId", botAuth, (req, res) => {
  User.findOne({ discordId: req.params.discordId }, (err, user) => {
    if (user) {
      res.send({ t60bananas: user.bananas.t60bananas });
    } else {
      res.send({ t60bananas: 0, message: "User not found" });
    }
  });
});

app.get("/getUserDiscordData/:uid", botAuth, (req, res) => {
  //for announceDailyLbResult
  User.findOne({ uid: req.body.uid }, (err, user) => {
    res.send({ name: user.name, discordId: user.discordId });
  });
});

app.get("/getUserPbs/:discordId", botAuth, (req, res) => {
  //for fix wpm role
  User.findOne({ discordId: req.params.discordId }, (err, user) => {
    if (user) {
      res.send({ personalBests: user.personalBests });
    } else {
      res.send({ error: "No user found with that id" });
    }
  });
});

app.get("/getUserPbsByUid/:uid", botAuth, (req, res) => {
  //for verify
  User.findOne({ uid: req.params.uid }, (err, user) => {
    if (user) {
      res.send({ personalBests: user.personalBests });
    } else {
      res.send({ error: "No user found with that id" });
    }
  });
});

app.get("/getTimeLeaderboard/:mode2/:type", botAuth, (req, res) => {
  //for lb
  Leaderboard.findOne({
    mode: "time",
    mode2: req.params.mode2,
    type: req.params.type,
  }).then((err, lb) => {
    //get top 10 leaderboard
    lb.board.length = 10;
    res.send({ board: lb.board });
  });
});

app.get("/getUserByDiscordId/:discordId", botAuth, (req, res) => {
  //for lb
  User.findOne({ discordId: req.params.discordId }, (err, user) => {
    if (user) {
      res.send({ uid: user.uid });
    } else {
      res.send({ error: "No user found with that id" });
    }
  });
});

app.get("/getRecentScore/:discordId", botAuth, (req, res) => {
  User.findOne({ discordId: req.params.discordId }, (err, user) => {
    if (user) {
      if (user.results.length == 0) {
        res.send({ recentScore: -1 });
      } else {
        res.send({ recentScore: user.results[user.results.length - 1] });
      }
    } else {
      res.send({ error: "No user found with that id" });
    }
  });
});

app.get("/getUserStats/:discordId", botAuth, (req, res) => {
  //for stats
  User.findOne({ discordId: req.params.discordId }, (err, user) => {
    if (user) {
      res.send({ stats: user.globalStats });
    } else {
      res.send({ error: "No user found with that id" });
    }
  });
});

app.post("/newBotCommand", botAuth, (req, res) => {
  let newBotCommand = new BotCommand({
    command: req.body.command, //is always "updateRole"
    arguments: req.body.arguments,
    executed: req.body.executed, //is always false
    requestTimestamp: req.body.requestTimestamp,
  });
  newBotCommand.save();
  res.status(200);
});
