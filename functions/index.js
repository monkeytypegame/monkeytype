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

/*
//this was commented out in the original code, and might not need to be transfered
exports.generatePairingCode = functions
  .runWith({
    timeoutSeconds: 100,
    memory: "2GB",
  })
  .https.onRequest((request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
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
    try {
      if (request === null) {
        console.error(
          `error while trying to generate discord pairing code - no input`
        );
        response.status(200).send({ data: { status: -999 } });
        return;
      }

      return db
        .collection("users")
        .doc(request.uid)
        .get()
        .then(async (userDoc) => {
          userDocData = userDoc.data();
          if (
            userDocData.discordPairingCode !== undefined &&
            userDocData.discordPairingCode !== null
          ) {
            console.log(
              `user ${request.uid} already has code ${userDocData.discordPairingCode}`
            );
            response.status(200).send({
              data: {
                status: -999,
                pairingCode: userDocData.discordPairingCode,
              },
            });
          } else {
            let stepSize = 1000;
            let existingCodes = [];
            let query = await db
              .collection(`users`)
              .where("discordPairingCode", ">", "")
              .limit(stepSize)
              .get();
            let lastDoc;
            while (query.docs.length > 0) {
              lastDoc = query.docs[query.docs.length - 1];
              query.docs.forEach((doc) => {
                let docData = doc.data();
                if (
                  docData.discordPairingCode !== undefined &&
                  docData.discordPairingCode !== null
                ) {
                  existingCodes.push(docData.discordPairingCode);
                }
              });
              query = await db
                .collection(`users`)
                .where("discordPairingCode", ">", "")
                .limit(stepSize)
                .startAfter(lastDoc)
                .get();
            }

            let randomCode = generate(9);

            while (existingCodes.includes(randomCode)) {
              randomCode = generate(9);
            }

            return db
              .collection("users")
              .doc(request.uid)
              .update(
                {
                  discordPairingCode: randomCode,
                },
                { merge: true }
              )
              .then((res) => {
                console.log(`generated ${randomCode} for user ${request.uid}`);
                response.status(200).send({
                  data: {
                    status: 1,
                    pairingCode: randomCode,
                  },
                });
                return;
              })
              .catch((e) => {
                console.error(
                  `error while trying to set discord pairing code ${randomCode} for user ${request.uid} - ${e}`
                );
                response.status(200).send({
                  data: {
                    status: -999,
                  },
                });
                return;
              });
          }
        });
    } catch (e) {
      console.error(
        `error while trying to generate discord pairing code for user ${request.uid} - ${e}`
      );
      response.status(200).send({
        data: {
          status: -999,
        },
      });
      return;
    }
  });
*/
