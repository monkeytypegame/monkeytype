import * as db from "../init/db";
import { v4 as uuidv4 } from "uuid";
import Logger from "../utils/logger";
import MonkeyError from "../utils/error";
import { incrementBadAuth } from "./rate-limit";
import type { NextFunction, Response } from "express";
import { MonkeyResponse, handleMonkeyResponse } from "../utils/monkey-response";
import {
  recordClientErrorByVersion,
  recordServerErrorByVersion,
} from "../utils/prometheus";
import { isDevEnvironment } from "../utils/misc";
import { ObjectId } from "mongodb";
import { version } from "../version";
import { addLog } from "../dal/logs";

type DBError = {
  _id: ObjectId;
  timestamp: number;
  status: number;
  uid: string;
  message: string;
  stack?: string;
  endpoint: string;
  method: string;
  url: string;
};

async function errorHandlingMiddleware(
  error: Error,
  req: MonkeyTypes.Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const monkeyError = error as MonkeyError;

    const monkeyResponse = new MonkeyResponse();
    monkeyResponse.status = 500;
    monkeyResponse.data = {
      errorId: monkeyError.errorId ?? uuidv4(),
      uid: monkeyError.uid ?? req.ctx?.decodedToken?.uid,
    };

    if (/ECONNREFUSED.*27017/i.test(error.message)) {
      monkeyResponse.message =
        "Could not connect to the database. It may be down.";
    } else if (error instanceof URIError || error instanceof SyntaxError) {
      monkeyResponse.status = 400;
      monkeyResponse.message = "Unprocessable request";
    } else if (error instanceof MonkeyError) {
      monkeyResponse.message = error.message;
      monkeyResponse.status = error.status;
    } else {
      monkeyResponse.message = `Oops! Our monkeys dropped their bananas. Please try again later. - ${monkeyResponse.data.errorId}`;
    }

    await incrementBadAuth(req, res, monkeyResponse.status);

    if (monkeyResponse.status >= 400 && monkeyResponse.status < 500) {
      recordClientErrorByVersion(req.headers["x-client-version"] as string);
    }

    if (
      !isDevEnvironment() &&
      monkeyResponse.status >= 500 &&
      monkeyResponse.status !== 503
    ) {
      recordServerErrorByVersion(version);

      const { uid, errorId } = monkeyResponse.data as {
        uid: string;
        errorId: string;
      };

      try {
        await addLog(
          "system_error",
          `${monkeyResponse.status} ${errorId} ${error.message} ${error.stack}`,
          uid
        );
        await db.collection<DBError>("errors").insertOne({
          _id: new ObjectId(errorId),
          timestamp: Date.now(),
          status: monkeyResponse.status,
          uid,
          message: error.message,
          stack: error.stack,
          endpoint: req.originalUrl,
          method: req.method,
          url: req.url,
        });
      } catch (e) {
        Logger.error("Logging to db failed.");
        Logger.error(e.message as string);
        console.error(e);
      }
    } else {
      Logger.error(`Error: ${error.message} Stack: ${error.stack}`);
    }

    if (monkeyResponse.status < 500) {
      delete monkeyResponse.data.errorId;
    }

    handleMonkeyResponse(monkeyResponse, res);
    return;
  } catch (e) {
    Logger.error("Error handling middleware failed.");
    Logger.error(e.message as string);
    console.error(e);
  }

  handleMonkeyResponse(
    new MonkeyResponse(
      "Something went really wrong, please contact support.",
      undefined,
      500
    ),
    res
  );
}

export default errorHandlingMiddleware;
