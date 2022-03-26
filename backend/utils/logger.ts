import db from "../init/db";
import chalk from "chalk";

const errorColor = chalk.red;
const warningColor = chalk.hex("#FFA500"); // Orange color
const successColor = chalk.green;
const infoColor = chalk.gray;

interface Log {
  type?: string;
  timestamp: number;
  uid: string;
  event: string;
  message: string;
}

export const log = async (
  event: string,
  message: any,
  uid?: string
): Promise<void> => {
  const logsCollection = db.collection<Log>("logs");

  console.log(new Date(), "\t", event, "\t", uid, "\t", message);
  logsCollection.insertOne({
    timestamp: Date.now(),
    uid: uid ?? "",
    event,
    message,
  });
};

export const logSuccess = (base: string, message: string): void => {
  const consoleMsg = prepMsg(base, message);
  console.log(successColor(consoleMsg));
};

export const logInfo = (base: string, message: any): void => {
  const consoleMsg = prepMsg(base, message);
  console.log(infoColor(consoleMsg));
};

export const logWarning = (base: string, message: any): void => {
  const consoleMsg = prepMsg(base, message);
  console.log(warningColor(consoleMsg));
};

export const logError = (base: string, message: any): void => {
  const consoleMsg = prepMsg(base, message);
  console.log(errorColor(consoleMsg));
};

const prepMsg = (base: string, message: string): string =>
  `${base} - ${message}`;
