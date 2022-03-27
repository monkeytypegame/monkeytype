import db from "../init/db";
import chalk from "chalk";
import winston, { format } from "winston";
import { join } from "path";

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

const customLevels = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const consoleFormat = format.printf((log) => {
  const baseMsg = `${log.level.toUpperCase()}: ${log.message}`;

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

export const logger = winston.createLogger({
  levels: customLevels,
  transports: [
    new winston.transports.File({
      level: "error",
      filename: join(__dirname, "../logs/error.log"),
      maxsize: 10485760, // 10MB
    }),
    new winston.transports.File({
      level: "success",
      filename: join(__dirname, "../logs/combined.log"),
      maxsize: 10485760, // 10MB
    }),
    new winston.transports.Console({ level: "success", format: consoleFormat }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: join(__dirname, "../logs/exceptions.log"),
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
