import db from "../init/db";

interface Log {
  timestamp: number;
  uid: string;
  event: string;
  message: string;
}

export default {
  async log(event: string, message: any, uid?: string): Promise<void> {
    const logsCollection = db.collection<Log>("logs");

    console.log(new Date(), "\t", event, "\t", uid, "\t", message);
    logsCollection.insertOne({
      timestamp: Date.now(),
      uid: uid ?? "",
      event,
      message,
    });
  },
};
