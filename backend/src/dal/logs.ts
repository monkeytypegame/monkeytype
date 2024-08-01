import { Collection, ObjectId } from "mongodb";
import * as db from "../init/db";
import Logger from "../utils/logger";

type DbLog = {
  _id: ObjectId;
  type?: string;
  timestamp: number;
  uid: string;
  important?: boolean;
  event: string;
  message: string | Record<string, unknown>;
};

export const getLogsCollection = (): Collection<DbLog> =>
  db.collection<DbLog>("logs");

async function insertIntoDb(
  event: string,
  message: string | Record<string, unknown>,
  uid = "",
  important = false
): Promise<void> {
  const dbLog: DbLog = {
    _id: new ObjectId(),
    timestamp: Date.now(),
    uid: uid ?? "",
    event: event,
    message: message,
    important: important,
  };

  if (!important) delete dbLog.important;

  Logger.info(`${event}\t${uid}\t${JSON.stringify(message)}`);

  await getLogsCollection().insertOne(dbLog);
}

export async function addLog(
  event: string,
  message: string | Record<string, unknown>,
  uid = ""
): Promise<void> {
  await insertIntoDb(event, message, uid);
}

export async function addImportantLog(
  event: string,
  message: string | Record<string, unknown>,
  uid = ""
): Promise<void> {
  await insertIntoDb(event, message, uid, true);
}

export async function deleteUserLogs(uid: string): Promise<void> {
  await getLogsCollection().deleteMany({ uid });
}
