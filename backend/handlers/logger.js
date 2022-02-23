import db from "../init/db.js";

export default {
  async log(event, message, uid) {
    const logsCollection = db.collection("logs");

    console.log(new Date(), "\t", event, "\t", uid, "\t", message);
    await logsCollection.insertOne({
      timestamp: Date.now(),
      uid,
      event,
      message,
    });
  },
};
