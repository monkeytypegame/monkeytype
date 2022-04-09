import db from "../init/db";
import logger from "./logger";

interface Log {
  type?: string;
  timestamp: number;
  uid: string;
  event: string;
  message: string;
}

const logToDb = async (
  event: string,
  message: any,
  uid?: string
): Promise<void> => {
  const logsCollection = db.collection<Log>("logs");

  logger.info(`${event}\t${uid}\t${JSON.stringify(message)}`);
  logsCollection.insertOne({
    timestamp: Date.now(),
    uid: uid ?? "",
    event,
    message,
  });
};

export default logToDb;
