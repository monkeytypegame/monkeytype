const { mongoDB } = require("../init/mongodb");

async function log(event, message, uid) {
  await mongoDB.collection("logs").insertOne({
    timestamp: Date.now(),
    uid,
    event,
    message,
  });
}

module.exports = {
  log,
};
