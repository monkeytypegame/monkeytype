import DatabaseClient from "../init/db.js";

export default {
  async log(event, message, uid) {
    const logsCollection = DatabaseClient.collection("logs");

    console.log(new Date(), "\t", event, "\t", uid, "\t", message);
    await logsCollection.insertOne({
      timestamp: Date.now(),
      uid,
      event,
      message,
    });
  },
};
