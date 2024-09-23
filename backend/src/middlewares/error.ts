import * as db from "../init/db";
import { v4 as uuidv4 } from "uuid";
import Logger from "../utils/logger";
import MonkeyError, { getErrorMessage } from "../utils/error";
import { incrementBadAuth } from "./rate-limit";
import type { NextFunction, Response } from "express";
import { isCustomCode } from "../constants/monkey-status-codes";

import {
  recordClientErrorByVersion,
  recordServerErrorByVersion,
} from "../utils/prometheus";
import { isDevEnvironment } from "../utils/misc";
import { ObjectId } from "mongodb";
import { version } from "../version";
import { addLog } from "../dal/logs";
import { ExpressRequestWithContext } from "../api/types";

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

type ErrorData = {
  errorId?: string;
  uid: string;
};

async function errorHandlingMiddleware(
  error: Error,
  req: ExpressRequestWithContext,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const monkeyError = error as MonkeyError;
    let status = 500;
    const data: { errorId?: string; uid: string } = {
      errorId: monkeyError.errorId ?? uuidv4(),
      uid: monkeyError.uid ?? req.ctx?.decodedToken?.uid,
    };
    let message = "Unknown error";

    if (/ECONNREFUSED.*27017/i.test(error.message)) {
      message = "Could not connect to the database. It may be down.";
    } else if (error instanceof URIError || error instanceof SyntaxError) {
      status = 400;
      message = "Unprocessable request";
    } else if (error instanceof MonkeyError) {
      message = error.message;
      status = error.status;
    } else {
      message = `Oops! Our monkeys dropped their bananas. Please try again later. - ${data.errorId}`;
    }

    await incrementBadAuth(req, res, status);

    if (status >= 400 && status < 500) {
      recordClientErrorByVersion(req.headers["x-client-version"] as string);
    }

    if (!isDevEnvironment() && status >= 500 && status !== 503) {
      recordServerErrorByVersion(version);

      const { uid, errorId } = data as {
        uid: string;
        errorId: string;
      };

      try {
        await addLog(
          "system_error",
          `${status} ${errorId} ${error.message} ${error.stack}`,
          uid
        );
        await db.collection<DBError>("errors").insertOne({
          _id: new ObjectId(errorId),
          timestamp: Date.now(),
          status: status,
          uid,
          message: error.message,
          stack: error.stack,
          endpoint: req.originalUrl,
          method: req.method,
          url: req.url,
        });
      } catch (e) {
        Logger.error("Logging to db failed.");
        Logger.error(getErrorMessage(e) ?? "Unknown error");
        console.error(e);
      }
    } else {
      Logger.error(`Error: ${error.message} Stack: ${error.stack}`);
    }

    if (status < 500) {
      delete data.errorId;
    }

    handleErrorResponse(res, status, message, data);
    return;
  } catch (e) {
    Logger.error("Error handling middleware failed.");
    Logger.error(getErrorMessage(e) ?? "Unknown error");
    console.error(e);
  }

  handleErrorResponse(
    res,
    500,
    "Something went really wrong, please contact support."
  );
}

function handleErrorResponse(
  res: Response,
  status: number,
  message: string,
  data?: ErrorData
): void {
  res.status(status);
  if (isCustomCode(status)) {
    res.statusMessage = message;
  }

  //@ts-expect-error ignored so that we can see message in swagger stats
  res.monkeyMessage = message;

  res.json({ message, data: data ?? null });
}

export default errorHandlingMiddleware;
