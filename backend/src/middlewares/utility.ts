import _ from "lodash";
import { Response, NextFunction, RequestHandler } from "express";
import { handleMonkeyResponse, MonkeyResponse } from "../utils/monkey-response";
import { isDevEnvironment } from "../utils/misc";

export const emptyMiddleware = (
  _req: MonkeyTypes.Request,
  _res: Response,
  next: NextFunction
): void => next();

type AsyncHandler = (
  req: MonkeyTypes.Request,
  res?: Response
) => Promise<MonkeyResponse>;

/**
 * This utility serves as an alternative to wrapping express handlers with try/catch statements.
 * Any routes that use an async handler function should wrap the handler with this function.
 * Without this, any errors thrown will not be caught by the error handling middleware, and
 * the app will hang!
 */
export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return async (
    req: MonkeyTypes.Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const handlerData = await handler(req, res);
      return handleMonkeyResponse(handlerData, res);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Uses the middlewares only in production. Otherwise, uses an empty middleware.
 */
export function useInProduction(
  middlewares: RequestHandler[]
): RequestHandler[] {
  return middlewares.map((middleware) =>
    isDevEnvironment() ? emptyMiddleware : middleware
  );
}
