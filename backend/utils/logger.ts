import "dotenv/config";
import db from "../init/db";
import chalk from "chalk";
import winston, { format } from "winston";
import { resolve } from "path";

const errorColor = chalk.red;
const warningColor = chalk.hex("#FFA500"); // Orange color
const successColor = chalk.green;
const infoColor = chalk.white;

const logFolderPath = process.env.LOG_FOLDER_PATH ?? "./logs";
const maxLogSize = parseInt(process.env.LOG_FILE_MAX_SIZE ?? "10485760");

interface Log {
  type?: string;
  timestamp: number;
  uid: string;
  event: string;
  message: string;
}

const customLevels = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const timestampFormat = format.timestamp({
  format: "MMM-DD-YYYY HH:mm:ss",
});
const simpleOutputFormat = format.printf((log) => {
  return `[${log.timestamp}]\t${log.level}: ${log.message}`;
});
const coloredOutputFormat = format.printf((log) => {
  const baseMsg = `[${log.timestamp}]\t${log.message}`;

  switch (log.level) {
    case "error":
      return errorColor(baseMsg);
    case "warning":
      return warningColor(baseMsg);
    case "info":
      return infoColor(baseMsg);
    case "success":
      return successColor(baseMsg);
  }

  return baseMsg;
});

const fileFormat = format.combine(timestampFormat, simpleOutputFormat);

const consoleFormat = format.combine(timestampFormat, coloredOutputFormat);

export const logger = winston.createLogger({
  levels: customLevels,
  transports: [
    new winston.transports.File({
      level: "error",
      filename: resolve(logFolderPath, "error.log"),
      maxsize: maxLogSize,
      format: fileFormat,
    }),
    new winston.transports.File({
      level: "success",
      filename: resolve(logFolderPath, "combined.log"),
      maxsize: maxLogSize,
      format: fileFormat,
    }),
    new winston.transports.Console({
      level: "success",
      format: consoleFormat,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: resolve(logFolderPath, "exceptions.log"),
      format: fileFormat,
    }),
  ],
});

export const logToDb = async (
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
