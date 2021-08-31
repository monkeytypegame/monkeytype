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

app.post("/attemptAddToLeaderboards", authenticateToken, (req, res) => {
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
                lb, (lbPosData = addToLeaderboard(lb, result, user.name)); //should uid be added instead of name? //or together
                console.log(user.lbMemory[lb.mode + lb.mode2][lb.type]);
                //lbPosData.foundAt = user.lbMemory[lb.mode+lb.mode2][lb.type];
                retData[lb.type] = lbPosData;
                lb.save();
                user.lbMemory[lb.mode + lb.mode2][lb.type] =
                  retData[lb.type].insertedAt;
                //check if made global top 10 and send to discord if it did
                if (lb.type == "global") {
                  let usr =
                    user.discordId != undefined ? user.discordId : user.name;
                  if (
                    retData.global !== null &&
                    retData.global.insertedAt >= 0 &&
                    retData.global.insertedAt <= 9 &&
                    retData.global.newBest
                  ) {
                    let lbstring = `${result.mode} ${result.mode2} global`;
                    console.log(
                      `sending command to the bot to announce lb update ${usr} ${
                        retData.global.insertedAt + 1
                      } ${lbstring} ${result.wpm}`
                    );

                    announceLbUpdate(
                      usr,
                      retData.global.insertedAt + 1,
                      lbstring,
                      result.wpm,
                      result.rawWpm,
                      result.acc,
                      result.consistency
                    );
                  }
                }
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

app.get("/getLeaderboard/:type/:mode/:mode2", (req, res) => {
  Leaderboard.findOne(
    { mode: req.params.mode, mode2: req.params.mode2, type: req.params.type },
    (err, lb) => {
      res.send(lb);
    }
  );
});

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
        User.findOne({ name: lb.board[0].name }, (err, user) => {
          if (user) {
            if (user.dailyLbWins === undefined) {
              user.dailyLbWins = {
                [lb.mode + lb.mode2]: 1,
              };
            } else if (user.dailyLbWins[lb.mode + lb.mode2] === undefined) {
              user.dailyLbWins[lb.mode + lb.mode2] = 1;
            } else {
              user.dailyLbWins[lb.mode + lb.mode2]++;
            }
            user.save();
          }
        }).then(() => {
          announceDailyLbResult(lb);
          lb.board = [];
          lb.save();
        });
      });
    });
    clearDailyLeaderboards();
  }, nextClear.getTime() - currentTime.getTime());
}
