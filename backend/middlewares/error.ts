import db from "../init/db";
import { v4 as uuidv4 } from "uuid";
import Logger from "../utils/logger";
import MonkeyError from "../utils/error";
import { MonkeyResponse, handleMonkeyResponse } from "../utils/monkey-response";
import { NextFunction, Response } from "express";

async function errorHandlingMiddleware(
  error: Error,
  req: MonkeyTypes.Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
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

  if (process.env.MODE !== "dev" && monkeyResponse.status >= 500) {
    const { uid, errorId } = monkeyResponse.data;

    try {
      await Logger.log(
        "system_error",
        `${monkeyResponse.status} ${error.message} ${error.stack}`,
        uid
      );
      await db.collection<any>("errors").insertOne({
        _id: errorId,
        timestamp: Date.now(),
        status: monkeyResponse.status,
        uid,
        message: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
      });
    } catch (e) {
      console.error("Failed to save error.");
      console.error(e);
    }
  } else {
    console.error(error.message);
    console.error(error.stack);
  }

  return handleMonkeyResponse(monkeyResponse, res);
}

export default errorHandlingMiddleware;
