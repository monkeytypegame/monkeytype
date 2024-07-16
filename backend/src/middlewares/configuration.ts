import { Response, NextFunction, RequestHandler } from "express";
import MonkeyError from "../utils/error";

export type ValidationOptions<T> = {
  criteria: (data: T) => boolean;
  invalidMessage?: string;
};

/**
 * This utility checks that the server's configuration matches
 * the criteria.
 */
export function validate(
  options: ValidationOptions<SharedTypes.Configuration>
): RequestHandler {
  const {
    criteria,
    invalidMessage = "This service is currently unavailable.",
  } = options;

  return (req: MonkeyTypes.Request, _res: Response, next: NextFunction) => {
    const configuration = req.ctx.configuration;

    const validated = criteria(configuration);
    if (!validated) {
      throw new MonkeyError(503, invalidMessage);
    }

    next();
  };
}
