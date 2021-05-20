const functions = require("firebase-functions");
const admin = require("firebase-admin");
let key = "./serviceAccountKey.json";
let origin = "http://localhost:5000";

if (process.env.GCLOUD_PROJECT === "monkey-type") {
  key = "./serviceAccountKey_live.json";
  origin = "https://monkeytype.com";
}

var serviceAccount = require(key);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();
const fetch = require("node-fetch");

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

exports.reserveDisplayName = functions.https.onCall(
  async (request, response) => {
    try {
      let udata = await db.collection("users").doc(request.uid).get();
      udata = udata.data();
      if (request.name.toLowerCase() === udata.name.toLowerCase()) {
        db.collection("takenNames").doc(request.name.toLowerCase()).set(
          {
            taken: true,
          },
          { merge: true }
        );
        console.log(`Reserved name ${request.name}`);
      } else {
        console.error(
          `Could not reserve name. ${request.name.toLowerCase()} != ${udata.name.toLowerCase()}`
        );
      }
    } catch (e) {
      console.error(`Could not reserve name. ${e}`);
    }
  }
);

exports.changeDisplayName = functions.https.onCall(
  async (request, response) => {
    try {
      if (!isUsernameValid(request.name))
        return { status: -1, message: "Name not valid" };
      let taken = await db
        .collection("takenNames")
        .doc(request.name.toLowerCase())
        .get();
      taken = taken.data();
      if (taken === undefined || taken.taken === false) {
        //not taken
        let oldname = admin.auth().getUser(request.uid);
        oldname = (await oldname).displayName;
        await admin
          .auth()
          .updateUser(request.uid, { displayName: request.name });
        await db
          .collection("users")
          .doc(request.uid)
          .set({ name: request.name }, { merge: true });
        await db.collection("takenNames").doc(request.name.toLowerCase()).set(
          {
            taken: true,
          },
          { merge: true }
        );
        await db.collection("takenNames").doc(oldname.toLowerCase()).delete();
        return { status: 1, message: "Updated" };
      } else {
        return { status: -2, message: "Name taken." };
      }
    } catch (e) {
      return { status: -999, message: "Error: " + e.message };
    }
  }
);

exports.clearName = functions.auth.user().onDelete((user) => {
  db.collection("takenNames").doc(user.displayName.toLowerCase()).delete();
  db.collection("users").doc(user.uid).delete();
});

exports.checkNameAvailability = functions.https.onRequest(
  async (request, response) => {
    response.set("Access-Control-Allow-Origin", origin);
    if (request.method === "OPTIONS") {
      // Send response to OPTIONS requests
      response.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      response.set(
        "Access-Control-Allow-Headers",
        "Authorization,Content-Type"
      );
      response.set("Access-Control-Max-Age", "3600");
      response.status(204).send("");
      return;
    }
    request = request.body.data;

    // 1 - available
    // -1 - unavailable (taken)
    // -2 - not valid name
    // -999 - unknown error
    try {
      if (!isUsernameValid(request.name)) {
        response.status(200).send({
          data: {
            resultCode: -2,
            message: "Username is not valid",
          },
        });
        return;
      }

      let takendata = await db
        .collection("takenNames")
        .doc(request.name.toLowerCase())
        .get();

      takendata = takendata.data();

      if (takendata !== undefined && takendata.taken) {
        response.status(200).send({
          data: {
            resultCode: -1,
            message: "Username is taken",
          },
        });
        return;
      } else {
        response.status(200).send({
          data: {
            resultCode: 1,
            message: "Username is available",
          },
        });
        return;
      }

      // return getAllNames().then((data) => {
      //   let available = 1;
      //   data.forEach((name) => {
      //     try {
      //       if (name.toLowerCase() === request.name.toLowerCase()) available = -1;
      //     } catch (e) {
      //       //
      //     }
      //   });
      //   return available;
      // });
    } catch (e) {
      console.error(
        `Error while checking name availability for ${request.name}:` +
          e.message
      );
      response.status(200).send({
        data: {
          resultCode: -999,
          message: "Unexpected error: " + e,
        },
      });
      return;
    }
  }
);

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

exports.resetPersonalBests = functions.https.onCall(
  async (request, response) => {
    let uid = request.uid;

    try {
      var user = await db.collection("users").doc(uid);
      await user.update({ personalBests: {} });
      return true;
    } catch (e) {
      console.log(
        `something went wrong when deleting personal bests for ${uid}: ${e.message}`
      );
      return false;
    }
  }
);

async function checkIfTagPB(uid, obj, userdata) {
  if (obj.tags.length === 0) {
    return [];
  }
  if (obj.mode == "quote") {
    return [];
  }
  let dbtags = [];
  let restags = obj.tags;
  try {
    let snap = await db.collection(`users/${uid}/tags`).get();
    snap.forEach((doc) => {
      if (restags.includes(doc.id)) {
        let data = doc.data();
        data.id = doc.id;
        dbtags.push(data);
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
      if (pbs === undefined) {
        throw new Error("pb is undefined");
      }
    } catch (e) {
      //undefined personal best = new personal best
      db.collection(`users/${uid}/tags`)
        .doc(dbtags[i].id)
        .set(
          {
            personalBests: {
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
            },
          },
          { merge: true }
        )
        .then((e) => {
          ret.push(dbtags[i].id);
        });
      continue;
    }
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
      db.collection(`users/${uid}/tags`)
        .doc(dbtags[i].id)
        .update({ personalBests: pbs });
      ret.push(dbtags[i].id);
    }
  }
  return ret;
}

exports.clearTagPb = functions.https.onCall((request, response) => {
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

function stdDev(array) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}

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

exports.verifyUser = functions.https.onRequest(async (request, response) => {
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
  if (request.uid == undefined) {
    response
      .status(200)
      .send({ data: { status: -1, message: "Need to provide uid" } });
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

        if (
          (await db.collection("users").where("discordId", "==", did).get())
            .docs.length > 0
        ) {
          response.status(200).send({
            data: {
              status: -1,
              message:
                "This Discord account is already paired to a different Monkeytype account",
            },
          });
          return;
        }

        await db.collection("users").doc(request.uid).update({
          discordId: did,
        });
        await db.collection("bot-commands").add({
          command: "verify",
          arguments: [did, request.uid],
          executed: false,
          requestTimestamp: Date.now(),
        });
        response
          .status(200)
          .send({ data: { status: 1, message: "Verified", did: did } });
        return;
      })
      .catch((e) => {
        console.error(
          "Something went wrong when trying to verify user " + e.message
        );
        response.status(200).send({ data: { status: -1, message: e.message } });
        return;
      });
  } catch (e) {
    response.status(200).send({ data: { status: -1, message: e } });
    return;
  }
});

async function getUpdatedLbMemory(userdata, mode, mode2, globallb, dailylb) {
  let lbmemory = userdata.lbMemory;

  if (lbmemory === undefined) {
    lbmemory = {};
  }

  if (lbmemory[mode + mode2] == undefined) {
    lbmemory[mode + mode2] = {
      global: null,
      daily: null,
    };
  }

  if (globallb.insertedAt === -1) {
    lbmemory[mode + mode2]["global"] = globallb.insertedAt;
  } else if (globallb.insertedAt >= 0) {
    if (globallb.newBest) {
      lbmemory[mode + mode2]["global"] = globallb.insertedAt;
    } else {
      lbmemory[mode + mode2]["global"] = globallb.foundAt;
    }
  }

  if (dailylb.insertedAt === -1) {
    lbmemory[mode + mode2]["daily"] = dailylb.insertedAt;
  } else if (dailylb.insertedAt >= 0) {
    if (dailylb.newBest) {
      lbmemory[mode + mode2]["daily"] = dailylb.insertedAt;
    } else {
      lbmemory[mode + mode2]["daily"] = dailylb.foundAt;
    }
  }

  return lbmemory;
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

exports.updateEmail = functions.https.onCall(async (request, response) => {
  try {
    let previousEmail = await admin.auth().getUser(request.uid);

    if (previousEmail.email !== request.previousEmail) {
      return { resultCode: -1 };
    } else {
      await admin.auth().updateUser(request.uid, {
        email: request.newEmail,
        emailVerified: false,
      });
      return {
        resultCode: 1,
      };
    }
  } catch (e) {
    console.error(`error updating email for ${request.uid} - ${e}`);
    return {
      resultCode: -999,
      message: e.message,
    };
  }
});

function updateDiscordRole(discordId, wpm) {
  db.collection("bot-commands").add({
    command: "updateRole",
    arguments: [discordId, wpm],
    executed: false,
    requestTimestamp: Date.now(),
  });
}

function isTagPresetNameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 16) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

exports.addTag = functions.https.onCall((request, response) => {
  try {
    if (!isTagPresetNameValid(request.name)) {
      return { resultCode: -1 };
    } else {
      return db
        .collection(`users/${request.uid}/tags`)
        .add({
          name: request.name,
        })
        .then((e) => {
          console.log(`user ${request.uid} created a tag: ${request.name}`);
          return {
            resultCode: 1,
            id: e.id,
          };
        })
        .catch((e) => {
          console.error(
            `error while creating tag for user ${request.uid}: ${e.message}`
          );
          return { resultCode: -999, message: e.message };
        });
    }
  } catch (e) {
    console.error(`error adding tag for ${request.uid} - ${e}`);
    return { resultCode: -999, message: e.message };
  }
});

exports.editTag = functions.https.onCall((request, response) => {
  try {
    if (!isTagPresetNameValid(request.name)) {
      return { resultCode: -1 };
    } else {
      return db
        .collection(`users/${request.uid}/tags`)
        .doc(request.tagid)
        .update({
          name: request.name,
        })
        .then((e) => {
          console.log(`user ${request.uid} updated a tag: ${request.name}`);
          return {
            resultCode: 1,
          };
        })
        .catch((e) => {
          console.error(
            `error while updating tag for user ${request.uid}: ${e.message}`
          );
          return { resultCode: -999, message: e.message };
        });
    }
  } catch (e) {
    console.error(`error updating tag for ${request.uid} - ${e}`);
    return { resultCode: -999, message: e.message };
  }
});

exports.removeTag = functions.https.onCall((request, response) => {
  try {
    return db
      .collection(`users/${request.uid}/tags`)
      .doc(request.tagid)
      .delete()
      .then((e) => {
        console.log(`user ${request.uid} deleted a tag`);
        return {
          resultCode: 1,
        };
      })
      .catch((e) => {
        console.error(
          `error deleting tag for user ${request.uid}: ${e.message}`
        );
        return { resultCode: -999 };
      });
  } catch (e) {
    console.error(`error deleting tag for ${request.uid} - ${e}`);
    return { resultCode: -999 };
  }
});

exports.updateResultTags = functions.https.onCall((request, response) => {
  try {
    let validTags = true;
    request.tags.forEach((tag) => {
      if (!/^[0-9a-zA-Z]+$/.test(tag)) validTags = false;
    });
    if (validTags) {
      return db
        .collection(`users/${request.uid}/results`)
        .doc(request.resultid)
        .update({
          tags: request.tags,
        })
        .then((e) => {
          console.log(
            `user ${request.uid} updated tags for result ${request.resultid}`
          );
          return {
            resultCode: 1,
          };
        })
        .catch((e) => {
          console.error(
            `error while updating tags for result by user ${request.uid}: ${e.message}`
          );
          return { resultCode: -999 };
        });
    } else {
      console.error(`invalid tags for user ${request.uid}: ${request.tags}`);
      return { resultCode: -1 };
    }
  } catch (e) {
    console.error(`error updating tags by ${request.uid} - ${e}`);
    return { resultCode: -999, message: e };
  }
});

function isConfigKeyValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 30) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

exports.saveConfig = functions.https.onCall((request, response) => {
  try {
    if (request.uid === undefined || request.obj === undefined) {
      console.error(`error saving config for ${request.uid} - missing input`);
      return {
        resultCode: -1,
        message: "Missing input",
      };
    }

    let obj = request.obj;
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
        `error saving config for ${request.uid} - bad input - ${JSON.stringify(
          request.obj
        )}`
      );
      return {
        resultCode: -1,
        message: "Bad input. " + errorMessage,
      };
    }

    return db
      .collection(`users`)
      .doc(request.uid)
      .set(
        {
          config: obj,
        },
        { merge: true }
      )
      .then((e) => {
        return {
          resultCode: 1,
          message: "Saved",
        };
      })
      .catch((e) => {
        console.error(
          `error saving config to DB for ${request.uid} - ${e.message}`
        );
        return {
          resultCode: -1,
          message: e.message,
        };
      });
  } catch (e) {
    console.error(`error saving config for ${request.uid} - ${e}`);
    return {
      resultCode: -999,
      message: e,
    };
  }
});

exports.addPreset = functions.https.onCall(async (request, response) => {
  try {
    if (!isTagPresetNameValid(request.obj.name)) {
      return { resultCode: -1 };
    } else if (request.uid === undefined || request.obj === undefined) {
      console.error(`error saving config for ${request.uid} - missing input`);
      return {
        resultCode: -1,
        message: "Missing input",
      };
    } else {
      let config = request.obj.config;
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
          `error adding preset for ${
            request.uid
          } - bad input - ${JSON.stringify(request.obj)}`
        );
        return {
          resultCode: -1,
          message: "Bad input. " + errorMessage,
        };
      }

      let presets = await db.collection(`users/${request.uid}/presets`).get();
      if (presets.docs.length >= 10) {
        return {
          resultCode: -2,
          message: "Preset limit",
        };
      }

      return db
        .collection(`users/${request.uid}/presets`)
        .add(request.obj)
        .then((e) => {
          return {
            resultCode: 1,
            message: "Saved",
            id: e.id,
          };
        })
        .catch((e) => {
          console.error(
            `error adding preset to DB for ${request.uid} - ${e.message}`
          );
          return {
            resultCode: -1,
            message: e.message,
          };
        });
    }
  } catch (e) {
    console.error(`error adding preset for ${request.uid} - ${e}`);
    return {
      resultCode: -999,
      message: e,
    };
  }
});

exports.editPreset = functions.https.onCall((request, response) => {
  try {
    if (!isTagPresetNameValid(request.name)) {
      return { resultCode: -1 };
    } else {
      return db
        .collection(`users/${request.uid}/presets`)
        .doc(request.presetid)
        .set({
          config: request.config,
          name: request.name,
        })
        .then((e) => {
          console.log(`user ${request.uid} updated a preset: ${request.name}`);
          return {
            resultCode: 1,
          };
        })
        .catch((e) => {
          console.error(
            `error while updating preset for user ${request.uid}: ${e.message}`
          );
          return { resultCode: -999, message: e.message };
        });
    }
  } catch (e) {
    console.error(`error updating preset for ${request.uid} - ${e}`);
    return { resultCode: -999, message: e.message };
  }
});

exports.removePreset = functions.https.onCall((request, response) => {
  try {
    return db
      .collection(`users/${request.uid}/presets`)
      .doc(request.presetid)
      .delete()
      .then((e) => {
        console.log(`user ${request.uid} deleted a tag`);
        return {
          resultCode: 1,
        };
      })
      .catch((e) => {
        console.error(
          `error deleting tag for user ${request.uid}: ${e.message}`
        );
        return { resultCode: -999 };
      });
  } catch (e) {
    console.error(`error deleting tag for ${request.uid} - ${e}`);
    return { resultCode: -999 };
  }
});

function generate(n) {
  var add = 1,
    max = 12 - add;

  if (n > max) {
    return generate(max) + generate(n - max);
  }

  max = Math.pow(10, n + add);
  var min = max / 10; // Math.pow(10, n) basically
  var number = Math.floor(Math.random() * (max - min + 1)) + min;

  return ("" + number).substring(add);
}

class Leaderboard {
  constructor(size, mode, mode2, type, starting) {
    this.size = size;
    this.board = [];
    this.mode = mode;
    this.mode2 = parseInt(mode2);
    this.type = type;
    if (starting !== undefined && starting !== null) {
      starting.forEach((entry) => {
        if (
          entry.mode == this.mode &&
          parseInt(entry.mode2) === parseInt(this.mode2)
        ) {
          let hid = entry.hidden === undefined ? false : entry.hidden;
          this.board.push({
            uid: entry.uid,
            name: entry.name,
            wpm: parseFloat(entry.wpm),
            raw: parseFloat(entry.raw),
            acc: parseFloat(entry.acc),
            consistency: isNaN(parseInt(entry.consistency))
              ? "-"
              : parseInt(entry.consistency),
            mode: entry.mode,
            mode2: parseInt(entry.mode2),
            timestamp: entry.timestamp,
            hidden: hid,
          });
        }
      });
    }
    this.sortBoard();
    this.clipBoard();
  }
  sortBoard() {
    this.board.sort((a, b) => {
      if (a.wpm === b.wpm) {
        if (a.acc === b.acc) {
          return a.timestamp - b.timestamp;
        } else {
          return b.acc - a.acc;
        }
      } else {
        return b.wpm - a.wpm;
      }
    });
  }
  clipBoard() {
    let boardLength = this.board.length;
    if (boardLength > this.size) {
      while (this.board.length !== this.size) {
        this.board.pop();
      }
    }
  }
  logBoard() {
    console.log(this.board);
  }
  getMinWpm() {
    return this.board[this.board.length - 1].wpm;
  }
  removeDuplicates(insertedAt, uid) {
    //return true if a better result is found
    let found = false;
    // let ret;
    let foundAt = null;
    if (this.board !== undefined) {
      this.board.forEach((entry, index) => {
        if (entry.uid === uid) {
          if (found) {
            this.board.splice(index, 1);
            // if (index > insertedAt) {
            //   //removed old result
            //   ret = false;
            // } else {
            //   ret = true;
            // }
          } else {
            found = true;
            foundAt = index;
          }
        }
      });
    }
    // console.log(ret);
    // return ret;
    return foundAt;
  }
  insert(a) {
    let insertedAt = -1;
    if (a.mode == this.mode && parseInt(a.mode2) === parseInt(this.mode2)) {
      if (
        this.board.length !== this.size ||
        (this.board.length === this.size && a.wpm > this.getMinWpm())
      ) {
        this.board.forEach((b, index) => {
          if (insertedAt !== -1) return;
          if (a.wpm === b.wpm) {
            if (a.acc === b.acc) {
              if (a.timestamp < b.timestamp) {
                this.board.splice(index, 0, {
                  uid: a.uid,
                  name: a.name,
                  wpm: parseFloat(a.wpm),
                  raw: parseFloat(a.rawWpm),
                  acc: parseFloat(a.acc),
                  consistency: isNaN(parseInt(a.consistency))
                    ? "-"
                    : parseInt(a.consistency),
                  mode: a.mode,
                  mode2: parseInt(a.mode2),
                  timestamp: a.timestamp,
                  hidden: a.hidden === undefined ? false : a.hidden,
                });
                insertedAt = index;
              }
            } else {
              if (a.acc > b.acc) {
                this.board.splice(index, 0, {
                  uid: a.uid,
                  name: a.name,
                  wpm: parseFloat(a.wpm),
                  raw: parseFloat(a.rawWpm),
                  acc: parseFloat(a.acc),
                  consistency: isNaN(parseInt(a.consistency))
                    ? "-"
                    : parseInt(a.consistency),
                  mode: a.mode,
                  mode2: parseInt(a.mode2),
                  timestamp: a.timestamp,
                  hidden: a.hidden === undefined ? false : a.hidden,
                });
                insertedAt = index;
              }
            }
          } else {
            if (a.wpm > b.wpm) {
              this.board.splice(index, 0, {
                uid: a.uid,
                name: a.name,
                wpm: parseFloat(a.wpm),
                raw: parseFloat(a.rawWpm),
                acc: parseFloat(a.acc),
                consistency: isNaN(parseInt(a.consistency))
                  ? "-"
                  : parseInt(a.consistency),
                mode: a.mode,
                mode2: parseInt(a.mode2),
                timestamp: a.timestamp,
                hidden: a.hidden === undefined ? false : a.hidden,
              });
              insertedAt = index;
            }
          }
        });
        if (this.board.length < this.size && insertedAt === -1) {
          this.board.push({
            uid: a.uid,
            name: a.name,
            wpm: parseFloat(a.wpm),
            raw: parseFloat(a.rawWpm),
            acc: parseFloat(a.acc),
            consistency: isNaN(parseInt(a.consistency))
              ? "-"
              : parseInt(a.consistency),
            mode: a.mode,
            mode2: parseInt(a.mode2),
            timestamp: a.timestamp,
            hidden: a.hidden === undefined ? false : a.hidden,
          });
          insertedAt = this.board.length - 1;
        }
        // console.log("before duplicate remove");
        // console.log(this.board);
        let newBest = false;
        let foundAt = null;
        if (insertedAt >= 0) {
          // if (this.removeDuplicates(insertedAt, a.uid)) {
          //   insertedAt = -2;
          // }
          foundAt = this.removeDuplicates(insertedAt, a.uid);

          if (foundAt >= insertedAt) {
            //new better result
            newBest = true;
          }
        }
        // console.log(this.board);
        this.clipBoard();
        return {
          insertedAt: insertedAt,
          newBest: newBest,
          foundAt: foundAt,
        };
      } else {
        return {
          insertedAt: -999,
        };
      }
    } else {
      return {
        insertedAt: -999,
      };
    }
  }
}

exports.unlinkDiscord = functions.https.onRequest((request, response) => {
  response.set("Access-Control-Allow-Origin", origin);
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
    if (request === null || request.uid === undefined) {
      response
        .status(200)
        .send({ data: { status: -999, message: "Empty request" } });
      return;
    }
    return db
      .collection(`users`)
      .doc(request.uid)
      .update({
        discordId: null,
      })
      .then((f) => {
        response.status(200).send({
          data: {
            status: 1,
            message: "Unlinked",
          },
        });
        return;
      })
      .catch((e) => {
        response.status(200).send({
          data: {
            status: -999,
            message: e.message,
          },
        });
        return;
      });
  } catch (e) {
    response.status(200).send({
      data: {
        status: -999,
        message: e,
      },
    });
    return;
  }
});

exports.checkLeaderboards = functions.https.onRequest(
  async (request, response) => {
    response.set("Access-Control-Allow-Origin", origin);
    if (request.method === "OPTIONS") {
      // Send response to OPTIONS requests
      response.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      response.set(
        "Access-Control-Allow-Headers",
        "Authorization,Content-Type"
      );
      response.set("Access-Control-Max-Age", "3600");
      response.status(204).send("");
      return;
    }
    request = request.body.data;

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
    let errCount = verifyValue(request);
    if (errCount > 0) {
      console.error(
        `error checking leaderboard for ${
          request.uid
        } error count ${errCount} - bad input - ${JSON.stringify(request.obj)}`
      );
      response.status(200).send({
        data: {
          status: -999,
          message: "Bad input",
        },
      });
      return;
    }

    let emailVerified = await admin
      .auth()
      .getUser(request.uid)
      .then((user) => {
        return user.emailVerified;
      });

    try {
      if (emailVerified === false) {
        response.status(200).send({
          data: {
            needsToVerifyEmail: true,
          },
        });
        return;
      }
      if (request.name === undefined) {
        response.status(200).send({
          data: {
            noName: true,
          },
        });
        return;
      }
      if (request.banned) {
        response.status(200).send({
          data: {
            banned: true,
          },
        });
        return;
      }
      if (request.verified === false) {
        response.status(200).send({
          data: {
            needsToVerify: true,
          },
        });
        return;
      }

      request.result.name = request.name;

      if (
        request.result.mode === "time" &&
        ["15", "60"].includes(String(request.result.mode2)) &&
        request.result.language === "english" &&
        request.result.funbox === "none"
      ) {
        let global = await db
          .runTransaction(async (t) => {
            const lbdoc = await t.get(
              db
                .collection("leaderboards")
                .where("mode", "==", String(request.result.mode))
                .where("mode2", "==", String(request.result.mode2))
                .where("type", "==", "global")
            );
            // let lbData;
            let docid = `${String(request.result.mode)}_${String(
              request.result.mode2
            )}_${"global"}`;
            // if (lbdoc.docs.length === 0) {
            //   console.log(
            //     `no ${request.mode} ${request.mode2} ${type} leaderboard found - creating`
            //   );
            //   let toAdd = {
            //     size: 20,
            //     mode: String(request.mode),
            //     mode2: String(request.mode2),
            //     type: type,
            //   };
            //   t.set(
            //     db
            //       .collection("leaderboards")
            //       .doc(
            //         `${String(request.mode)}_${String(request.mode2)}_${type}`
            //       ),
            //     toAdd
            //   );
            //   lbData = toAdd;
            // } else {
            //   lbData = lbdoc.docs[0].data();
            // }
            let boardInfo = lbdoc.docs[0].data();
            if (
              boardInfo.minWpm === undefined ||
              boardInfo.board.length !== boardInfo.size ||
              (boardInfo.minWpm !== undefined &&
                request.result.wpm > boardInfo.minWpm &&
                boardInfo.board.length === boardInfo.size)
            ) {
              let boardData = boardInfo.board;
              let lb = new Leaderboard(
                boardInfo.size,
                request.result.mode,
                request.result.mode2,
                boardInfo.type,
                boardData
              );
              let insertResult = lb.insert(request.result);
              if (insertResult.insertedAt >= 0) {
                t.update(db.collection("leaderboards").doc(docid), {
                  size: lb.size,
                  type: lb.type,
                  board: lb.board,
                  minWpm: lb.getMinWpm(),
                });
              }
              return insertResult;
            } else {
              //not above leaderboard minwpm
              return {
                insertedAt: -1,
              };
            }
          })
          .catch((error) => {
            console.error(
              `error in transaction checking leaderboards - ${error}`
            );
            response.status(200).send({
              data: {
                status: -999,
                message: error,
              },
            });
          });

        let daily = await db
          .runTransaction(async (t) => {
            const lbdoc = await t.get(
              db
                .collection("leaderboards")
                .where("mode", "==", String(request.result.mode))
                .where("mode2", "==", String(request.result.mode2))
                .where("type", "==", "daily")
            );
            // let lbData;
            let docid = `${String(request.result.mode)}_${String(
              request.result.mode2
            )}_${"daily"}`;
            // if (lbdoc.docs.length === 0) {
            //   console.log(
            //     `no ${request.mode} ${request.mode2} ${type} leaderboard found - creating`
            //   );
            //   let toAdd = {
            //     size: 20,
            //     mode: String(request.mode),
            //     mode2: String(request.mode2),
            //     type: type,
            //   };
            //   t.set(
            //     db
            //       .collection("leaderboards")
            //       .doc(
            //         `${String(request.mode)}_${String(request.mode2)}_${type}`
            //       ),
            //     toAdd
            //   );
            //   lbData = toAdd;
            // } else {
            //   lbData = lbdoc.docs[0].data();
            // }
            let boardInfo = lbdoc.docs[0].data();
            if (
              boardInfo.minWpm === undefined ||
              boardInfo.board.length !== boardInfo.size ||
              (boardInfo.minWpm !== undefined &&
                request.result.wpm > boardInfo.minWpm &&
                boardInfo.board.length === boardInfo.size)
            ) {
              let boardData = boardInfo.board;
              let lb = new Leaderboard(
                boardInfo.size,
                request.result.mode,
                request.result.mode2,
                boardInfo.type,
                boardData
              );
              let insertResult = lb.insert(request.result);
              if (insertResult.insertedAt >= 0) {
                t.update(db.collection("leaderboards").doc(docid), {
                  size: lb.size,
                  type: lb.type,
                  board: lb.board,
                  minWpm: lb.getMinWpm(),
                });
              }
              return insertResult;
            } else {
              //not above leaderboard minwpm
              return {
                insertedAt: -1,
              };
            }
          })
          .catch((error) => {
            console.error(
              `error in transaction checking leaderboards - ${error}`
            );
            response.status(200).send({
              data: {
                status: -999,
                message: error,
              },
            });
          });

        //send discord update
        let usr =
          request.discordId != undefined ? request.discordId : request.name;

        if (
          global !== null &&
          global.insertedAt >= 0 &&
          global.insertedAt <= 9 &&
          global.newBest
        ) {
          let lbstring = `${request.result.mode} ${request.result.mode2} global`;
          console.log(
            `sending command to the bot to announce lb update ${usr} ${
              global.insertedAt + 1
            } ${lbstring} ${request.result.wpm}`
          );

          announceLbUpdate(
            usr,
            global.insertedAt + 1,
            lbstring,
            request.result.wpm,
            request.result.rawWpm,
            request.result.acc,
            request.result.consistency
          );
        }

        //

        if (
          // obj.mode === "time" &&
          // (obj.mode2 == "15" || obj.mode2 == "60") &&
          // obj.language === "english"
          global !== null ||
          daily !== null
        ) {
          let updatedLbMemory = await getUpdatedLbMemory(
            request.lbMemory,
            request.result.mode,
            request.result.mode2,
            global,
            daily
          );
          db.collection("users").doc(request.uid).update({
            lbMemory: updatedLbMemory,
          });
        }

        response.status(200).send({
          data: {
            status: 2,
            daily: daily,
            global: global,
          },
        });
        return;
      } else {
        response.status(200).send({
          data: {
            status: 1,
            daily: {
              insertedAt: null,
            },
            global: {
              insertedAt: null,
            },
          },
        });
        return;
      }
    } catch (e) {
      console.log(e);
      response.status(200).send({
        data: {
          status: -999,
          message: e,
        },
      });
      return;
    }
  }
);

exports.getLeaderboard = functions.https.onCall((request, response) => {
  return db
    .collection("leaderboards")
    .where("mode", "==", String(request.mode))
    .where("mode2", "==", String(request.mode2))
    .where("type", "==", String(request.type))
    .get()
    .then(async (data) => {
      // console.log("got data");
      if (data.docs.length === 0) return null;
      let lbdata = data.docs[0].data();
      if (lbdata.board !== undefined) {
        // console.log("replacing users");

        // for (let i = 0; i < lbdata.board.length; i++) {
        //   await db
        //     .collection("users")
        //     .doc(lbdata.board[i].uid)
        //     .get()
        //     .then((doc) => {
        //       if (
        //         lbdata.board[i].uid !== null &&
        //         lbdata.board[i].uid === request.uid
        //       ) {
        //         lbdata.board[i].currentUser = true;
        //       }
        //       lbdata.board[i].name = doc.data().name;
        //       lbdata.board[i].uid = null;
        //     });
        // }

        lbdata.board.forEach((boardentry) => {
          if (boardentry.uid !== null && boardentry.uid === request.uid) {
            boardentry.currentUser = true;
          }
          boardentry.uid = null;
        });

        // console.log(lbdata);
        if (request.type === "daily") {
          let resetTime = new Date(Date.now());
          resetTime.setHours(0, 0, 0, 0);
          resetTime.setDate(resetTime.getUTCDate() + 1);
          resetTime = resetTime.valueOf();
          lbdata.resetTime = resetTime;
        }

        return lbdata;
      } else {
        if (
          lbdata.board === undefined ||
          lbdata.board === [] ||
          lbdata.board.length === 0
        ) {
          return lbdata;
        } else {
          return [];
        }
      }
    });
});

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

async function announceLbUpdate(discordId, pos, lb, wpm, raw, acc, con) {
  db.collection("bot-commands").add({
    command: "sayLbUpdate",
    arguments: [discordId, pos, lb, wpm, raw, acc, con],
    executed: false,
    requestTimestamp: Date.now(),
  });
}

async function announceDailyLbResult(lbdata) {
  db.collection("bot-commands").add({
    command: "announceDailyLbResult",
    arguments: [lbdata],
    executed: false,
    requestTimestamp: Date.now(),
  });
}
