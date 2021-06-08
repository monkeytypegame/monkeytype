// async function incrementUserGlobalTypingStats(userData, resultObj) {
//   let userGlobalStats = userData.globalStats;
//   try {
//     let newStarted;
//     let newCompleted;
//     let newTime;

//     let tt = 0;
//     let afk = resultObj.afkDuration;
//     if (afk == undefined) {
//       afk = 0;
//     }
//     tt = resultObj.testDuration + resultObj.incompleteTestSeconds - afk;

//     if (userGlobalStats.started === undefined) {
//       newStarted = resultObj.restartCount + 1;
//     } else {
//       newStarted = userGlobalStats.started + resultObj.restartCount + 1;
//     }
//     if (userGlobalStats.completed === undefined) {
//       newCompleted = 1;
//     } else {
//       newCompleted = userGlobalStats.completed + 1;
//     }
//     if (userGlobalStats.time === undefined) {
//       newTime = tt;
//     } else {
//       newTime = userGlobalStats.time + tt;
//     }
//     incrementPublicTypingStats(resultObj.restartCount + 1, 1, tt);
//     User.findOne({ uid: userData.uid }, (err, user) => {
//       user.globalStats = {
//         started: newStarted,
//         completed: newCompleted,
//         time: roundTo2(newTime),
//       };
//       user.save();
//     });
//   } catch (e) {
//     console.error(`Error while incrementing stats for user ${uid}: ${e}`);
//   }
// }

// app.get("/userResults", authenticateToken, (req, res) => {
//   User.findOne({ uid: req.uid }, (err, user) => {
//     if (err) res.status(500).send({ error: err });
//     res.status(200).send({ results: user.results });
//   });
//   res.sendStatus(200);
// });

// app.post("/unlinkDiscord", authenticateToken, (req, res) => {
//   request = req.body.data;
//   try {
//     if (request === null || req.uid === undefined) {
//       res.status(200).send({ status: -999, message: "Empty request" });
//       return;
//     }
//     User.findOne({ uid: req.uid }, (err, user) => {
//       user.discordId = null;
//       user.save();
//     })
//       .then((f) => {
//         res.status(200).send({
//           status: 1,
//           message: "Unlinked",
//         });
//       })
//       .catch((e) => {
//         res.status(200).send({
//           status: -999,
//           message: e.message,
//         });
//       });
//   } catch (e) {
//     res.status(200).send({
//       status: -999,
//       message: e,
//     });
//   }
// });

// app.post("/updateEmail", authenticateToken, (req, res) => {
//   try {
//     admin
//       .auth()
//       .getUser(req.uid)
//       .then((previous) => {
//         if (previous.email !== req.body.previousEmail) {
//           res.send({ resultCode: -1 });
//         } else {
//           User.findOne({ uid: req.uid }, (err, user) => {
//             user.email = req.body.newEmail;
//             user.emailVerified = false;
//             user.save();
//             res.send({ resultCode: 1 });
//           });
//         }
//       });
//   } catch (e) {
//     console.error(`error updating email for ${req.uid} - ${e}`);
//     res.send({
//       resultCode: -999,
//       message: e.message,
//     });
//   }
// });

app.post("/verifyDiscord", authenticateToken, (req, res) => {
  /* Not tested yet */
  response.set("Access-Control-Allow-Origin", origin);
  response.set("Access-Control-Allow-Headers", "*");
  response.set("Access-Control-Allow-Credentials", "true");
  if (request.method === "OPTIONS") {
    // Send response to OPTIONS requests
    response.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }
  request = req.body.data;
  if (request.uid == undefined) {
    response.status(200).send({ status: -1, message: "Need to provide uid" });
    return;
  }
  try {
    return fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: `${request.tokenType} ${request.accessToken}`,
      },
    })
      .then((res) => res.json())
      .then(async (res2) => {
        let did = res2.id;
        User.findOne({ discordId: did }, (err, user) => {
          if (user) {
            res.status(200).send({
              status: -1,
              message:
                "This Discord account is already paired to a different Monkeytype account",
            });
          } else {
            User.findOne({ uid: req.uid }, (err, user2) => {
              user2.discordId = did;
              user2.save();
              newCommand = new BotCommand({
                command: "verify",
                arguments: [did, req.uid],
                executed: false,
                requestTimestamp: Date.now(),
              });
              newCommand.save();
              res
                .status(200)
                .send({ status: 1, message: "Verified", did: did });
            });
          }
        });
      })
      .catch((e) => {
        console.error(
          "Something went wrong when trying to verify discord of user " +
            e.message
        );
        response.status(200).send({ status: -1, message: e.message });
      });
  } catch (e) {
    response.status(200).send({ status: -1, message: e });
  }
});

// app.post("/resetPersonalBests", authenticateToken, (req, res) => {
//   try {
//     User.findOne({ uid: req.uid }, (err, user) => {
//       if (err) res.status(500).send({ error: err });
//       user.personalBests = {};
//       user.save();
//     });
//     res.status(200).send({ status: "Reset Pbs successfully" });
//   } catch (e) {
//     console.log(
//       `something went wrong when deleting personal bests for ${uid}: ${e.message}`
//     );
//     res.status(500).send({ status: "Reset Pbs successfully" });
//   }
// });
