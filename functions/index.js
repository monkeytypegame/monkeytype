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

async function announceLbUpdate(discordId, pos, lb, wpm, raw, acc, con) {
  db.collection("bot-commands").add({
    command: "sayLbUpdate",
    arguments: [discordId, pos, lb, wpm, raw, acc, con],
    executed: false,
    requestTimestamp: Date.now(),
  });
}
