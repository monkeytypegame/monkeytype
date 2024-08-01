import * as db from "../init/db";
import chalk from "chalk";
import {
  format,
  createLogger,
  transports,
  type Logger as LoggerType,
} from "winston";
import { resolve } from "path";
import { ObjectId } from "mongodb";

const errorColor = chalk.red.bold;
const warningColor = chalk.yellow.bold;
const successColor = chalk.green.bold;
const infoColor = chalk.white;

const logFolderPath = process.env["LOG_FOLDER_PATH"] ?? "./logs";
const maxLogSize = parseInt(process.env["LOG_FILE_MAX_SIZE"] ?? "10485760");

type Log = {
  type?: string;
  timestamp: number;
  uid: string;
  important?: boolean;
  event: string;
  message: string | Record<string, unknown>;
};

const customLevels = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const timestampFormat = format.timestamp({
  format: "DD-MMM-YYYY HH:mm:ss.SSS",
});

const simpleOutputFormat = format.printf((log) => {
  return `${log["timestamp"]}\t${log.level}: ${log.message}`;
});

const coloredOutputFormat = format.printf((log) => {
  let color = infoColor;

  switch (log.level) {
    case "error":
      color = errorColor;
      break;
    case "warning":
      color = warningColor;
      break;
    case "success":
      color = successColor;
      break;
  }

  return `${log["timestamp"]}\t${color(log.message)}`;
});

const fileFormat = format.combine(timestampFormat, simpleOutputFormat);

const consoleFormat = format.combine(timestampFormat, coloredOutputFormat);

const logger = createLogger({
  levels: customLevels,
  transports: [
    new transports.File({
      level: "error",
      filename: resolve(logFolderPath, "error.log"),
      maxsize: maxLogSize,
      format: fileFormat,
    }),
    new transports.File({
      level: "success",
      filename: resolve(logFolderPath, "combined.log"),
      maxsize: maxLogSize,
      format: fileFormat,
    }),
    new transports.Console({
      level: "success",
      format: consoleFormat,
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: resolve(logFolderPath, "exceptions.log"),
      format: fileFormat,
    }),
  ],
});

const logToDb = async (
  event: string,
  message: string | Record<string, unknown>,
  uid?: string,
  important?: boolean
): Promise<void> => {
  const logsCollection = db.collection<Log>("logs");

  logger.info(`${event}\t${uid}\t${JSON.stringify(message)}`);

  const dbLog = {
    _id: new ObjectId(),
    timestamp: Date.now(),
    uid: uid ?? "",
    event,
    message,
  };

  if (important === true) {
    dbLog["important"] = true;
  }

  logsCollection.insertOne(dbLog).catch((error) => {
    logger.error(`Could not log to db: ${error.message}`);
  });
};

const Logger = {
  error: (message: string): LoggerType => logger.error(message),
  warning: (message: string): LoggerType => logger.warning(message),
  info: (message: string): LoggerType => logger.info(message),
  success: (message: string): LoggerType => logger.log("success", message),
  logToDb,
};

export default Logger;
