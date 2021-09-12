const { mongoDB } = require("../init/mongodb");

async function log(event, message, uid) {
  console.log(new Date(), "\t", event, "\t", uid, "\t", message);
  await mongoDB().collection("logs").insertOne({
    timestamp: Date.now(),
    uid,
    event,
    message,
  });
}

module.exports = {
  log,
};
