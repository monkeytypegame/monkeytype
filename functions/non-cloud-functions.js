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
