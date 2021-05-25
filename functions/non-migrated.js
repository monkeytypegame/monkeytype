exports.requestTest = functions.https.onRequest((request, response) => {
  response.set("Access-Control-Allow-Origin", origin);
  response.set("Access-Control-Allow-Headers", "*");
  response.set("Access-Control-Allow-Credentials", "true");
  response.status(200).send({ data: "test" });
});

exports.getPatreons = functions.https.onRequest(async (request, response) => {
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
  request = request.body.data;
  try {
    let patreon = await db.collection("patreon").doc("patreons").get();
    let data = patreon.data().list;

    data = data.sort((a, b) => {
      return b.value - a.value;
    });

    let ret = [];
    data.forEach((pdoc) => {
      ret.push(pdoc.name);
    });

    response.status(200).send({ data: ret });
    return;
  } catch (e) {
    response.status(200).send({ e });
    return;
  }
});

exports.clearTagPb = functions.https.onCall((request, response) => {
  //It looks like this button is not used anymore
  try {
    return db
      .collection(`users/${request.uid}/tags`)
      .doc(request.tagid)
      .update({
        pb: 0,
      })
      .then((e) => {
        return {
          resultCode: 1,
        };
      })
      .catch((e) => {
        console.error(
          `error deleting tag pb for user ${request.uid}: ${e.message}`
        );
        return {
          resultCode: -999,
          message: e.message,
        };
      });
  } catch (e) {
    console.error(`error deleting tag pb for ${request.uid} - ${e}`);
    return { resultCode: -999 };
  }
});

exports.removeSmallTestsAndQPB = functions.https.onCall(
  async (request, response) => {
    let uid = request.uid;

    try {
      let docs = await db
        .collection(`users/${uid}/results`)
        .where("mode", "==", "time")
        .where("mode2", "<", 15)
        .get();
      docs.forEach(async (doc) => {
        db.collection(`users/${uid}/results`).doc(doc.id).delete();
      });
      let docs2 = await db
        .collection(`users/${uid}/results`)
        .where("mode", "==", "words")
        .where("mode2", "<", 10)
        .get();
      docs2.forEach(async (doc) => {
        db.collection(`users/${uid}/results`).doc(doc.id).delete();
      });
      let docs3 = await db
        .collection(`users/${uid}/results`)
        .where("mode", "==", "custom")
        .where("testDuration", "<", 10)
        .get();
      docs3.forEach(async (doc) => {
        db.collection(`users/${uid}/results`).doc(doc.id).delete();
      });
      // console.log(`removing small tests for ${uid}: ${docs.size} time, ${docs2.size} words, ${docs3.size} custom`);
      let userdata = await db.collection(`users`).doc(uid).get();
      userdata = userdata.data();
      try {
        pbs = userdata.personalBests;
        // console.log(`removing ${Object.keys(pbs.quote).length} quote pb`);
        delete pbs.quote;
        await db.collection("users").doc(uid).update({ personalBests: pbs });
      } catch {}
      db.collection("users")
        .doc(uid)
        .set({ refactored: true }, { merge: true });
      console.log("removed small tests for " + uid);
    } catch (e) {
      console.log(`something went wrong for ${uid}: ${e.message}`);
    }
  }
);

async function getAllNames() {
  // return admin
  //   .auth()
  //   .listUsers()
  //   .then((data) => {
  //     let names = [];
  //     data.users.forEach((user) => {
  //       names.push(user.displayName);
  //     });
  //     return names;
  //   });

  let ret = [];

  async function getAll(nextPageToken) {
    // List batch of users, 1000 at a time.
    let listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    for (let i = 0; i < listUsersResult.users.length; i++) {
      ret.push(listUsersResult.users[i].displayName);
    }
    if (listUsersResult.pageToken) {
      // List next batch of users.
      await getAll(listUsersResult.pageToken);
    }
  }

  await getAll();
  return ret;
}

async function getAllUsers() {
  // return admin
  //   .auth()
  //   .listUsers()
  //   .then((data) => {
  //     let names = [];
  //     data.users.forEach((user) => {
  //       names.push(user.displayName);
  //     });
  //     return names;
  //   });

  let ret = [];

  async function getAll(nextPageToken) {
    // List batch of users, 1000 at a time.
    let listUsersResult = await auth.listUsers(1000, nextPageToken);
    for (let i = 0; i < listUsersResult.users.length; i++) {
      let loopuser = listUsersResult.users[i];

      //if custom claim is undefined check, if its true then ignore

      // if (loopuser === undefined || loopuser.customClaims === undefined || loopuser.customClaims['nameChecked'] === undefined) {
      ret.push(listUsersResult.users[i]);
      // }

      // console.log(loopuser.customClaims['asd']);

      // let userdata = await db.collection('users').doc(listUsersResult.users[i].uid).get();

      // let data = userdata.data();

      // if (data === undefined || data.needsToChangeName === undefined) {
      //   // console.log(data);
      //   ret.push(listUsersResult.users[i]);
      //   // console.log('user added');
      // } else {
      //   // console.log('user already added');
      // }
    }
    if (listUsersResult.pageToken) {
      // List next batch of users.
      await getAll(listUsersResult.pageToken);
    }
  }
  await getAll();
  return ret;
}

function isUsernameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (/miodec/.test(name.toLowerCase())) return false;
  if (/bitly/.test(name.toLowerCase())) return false;
  if (name.length > 14) return false;
  if (/^\..*/.test(name.toLowerCase())) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

async function incrementTestCounter(uid, userData) {
  try {
    if (userData.completedTests === undefined) {
      let results = await db.collection(`users/${uid}/results`).get();
      let count = results.docs.length;
      db.collection("users")
        .doc(uid)
        .update({
          completedTests: admin.firestore.FieldValue.increment(count),
        });
      db.collection("public")
        .doc("stats")
        .update({
          completedTests: admin.firestore.FieldValue.increment(count),
        });
    } else {
      db.collection("users")
        .doc(uid)
        .update({ completedTests: admin.firestore.FieldValue.increment(1) });
      db.collection("public")
        .doc("stats")
        .update({ completedTests: admin.firestore.FieldValue.increment(1) });
    }
  } catch (e) {
    console.error(
      `Error while incrementing completed tests for user ${uid}: ${e}`
    );
  }
}

async function incrementStartedTestCounter(uid, num, userData) {
  try {
    if (userData.startedTests === undefined) {
      let stepSize = 1000;
      let results = [];
      let query = await db
        .collection(`users/${uid}/results`)
        .orderBy("timestamp", "desc")
        .limit(stepSize)
        .get();
      let lastDoc;
      while (query.docs.length > 0) {
        lastDoc = query.docs[query.docs.length - 1];
        query.docs.forEach((doc) => {
          results.push({ restartCount: doc.data().restartCount });
        });
        query = await db
          .collection(`users/${uid}/results`)
          .orderBy("timestamp", "desc")
          .limit(stepSize)
          .startAfter(lastDoc)
          .get();
      }

      let count = 0;
      results.forEach((result) => {
        try {
          let rc = result.restartCount;
          if (rc === undefined) {
            rc = 0;
          }

          count += parseInt(rc);
        } catch (e) {}
      });
      count += results.length;
      db.collection("users")
        .doc(uid)
        .update({
          startedTests: admin.firestore.FieldValue.increment(count),
        });
      db.collection("public")
        .doc("stats")
        .update({
          startedTests: admin.firestore.FieldValue.increment(count),
        });
    } else {
      db.collection("users")
        .doc(uid)
        .update({ startedTests: admin.firestore.FieldValue.increment(num) });
      db.collection("public")
        .doc("stats")
        .update({ startedTests: admin.firestore.FieldValue.increment(num) });
    }
  } catch (e) {
    console.error(
      `Error while incrementing started tests for user ${uid}: ${e}`
    );
  }
}

exports.scheduledFunctionCrontab = functions.pubsub
  .schedule("00 00 * * *")
  .timeZone("Africa/Abidjan")
  .onRun((context) => {
    try {
      console.log("moving daily leaderboards to history");
      db.collection("leaderboards")
        .where("type", "==", "daily")
        .get()
        .then(async (res) => {
          for (let i = 0; i < res.docs.length; i++) {
            let doc = res.docs[i];

            let lbdata = doc.data();

            let winnerUid = lbdata.board[0].uid;
            await db
              .collection("users")
              .doc(winnerUid)
              .get()
              .then(async (userDoc) => {
                let userData = userDoc.data();
                let lbwins = userData.dailyLbWins;

                let lbname = lbdata.mode + lbdata.mode2;

                if (lbwins === undefined) {
                  //first win ever
                  lbwins = {
                    [lbname]: 1,
                  };
                } else {
                  //object already exists
                  if (lbwins[lbname] === undefined) {
                    lbwins[lbname] = 1;
                  } else {
                    lbwins[lbname] = lbwins[lbname] + 1;
                  }
                }
                await db.collection("users").doc(winnerUid).update({
                  dailyLbWins: lbwins,
                });
              });

            announceDailyLbResult(lbdata);
            t = new Date();
            // db.collection("leaderboards_history")
            //   .doc(
            //     `${t.getUTCDate()}_${t.getUTCMonth()}_${t.getUTCFullYear()}_${
            //       lbdata.mode
            //     }_${lbdata.mode2}`
            //   )
            //   .set(lbdata);
            db.collection("leaderboards").doc(doc.id).set(
              {
                board: [],
              },
              { merge: true }
            );
          }
        });
      return null;
    } catch (e) {
      console.error(`error while moving daily leaderboards to history - ${e}`);
    }
  });

async function announceDailyLbResult(lbdata) {
  db.collection("bot-commands").add({
    command: "announceDailyLbResult",
    arguments: [lbdata],
    executed: false,
    requestTimestamp: Date.now(),
  });
}
