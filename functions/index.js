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

async function announceLbUpdate(discordId, pos, lb, wpm, raw, acc, con) {
  db.collection("bot-commands").add({
    command: "sayLbUpdate",
    arguments: [discordId, pos, lb, wpm, raw, acc, con],
    executed: false,
    requestTimestamp: Date.now(),
  });
}
