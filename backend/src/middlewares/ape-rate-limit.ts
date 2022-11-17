import MonkeyError from "../utils/error";
import { Response, NextFunction, RequestHandler } from "express";
import statuses from "../constants/monkey-status-codes";
import rateLimit, {
  RateLimitRequestHandler,
  Options,
} from "express-rate-limit";

const REQUEST_MULTIPLIER = process.env.MODE === "dev" ? 1 : 1;

const getKey = (req: MonkeyTypes.Request, _res: Response): string => {
  return req?.ctx?.decodedToken?.uid;
};

const ONE_MINUTE = 1000 * 60;

const {
  APE_KEY_RATE_LIMIT_EXCEEDED: { message, code },
} = statuses;

export const customHandler = (
  _req: MonkeyTypes.Request,
  _res: Response,
  _next: NextFunction,
  _options: Options
): void => {
  throw new MonkeyError(code, message);
};

const apeRateLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKey,
  handler: customHandler,
});

export function withApeRateLimiter(
  defaultRateLimiter: RateLimitRequestHandler
): RequestHandler {
  return (req: MonkeyTypes.Request, res: Response, next: NextFunction) => {
    if (req.ctx.decodedToken.type === "ApeKey") {
      return apeRateLimiter(req, res, next);
    }

    return defaultRateLimiter(req, res, next);
  };
}

export function withCustomApeRateLimiter(
  customRateLimiter: RateLimitRequestHandler,
  defaultRateLimiter: RateLimitRequestHandler
): RequestHandler {
  return (req: MonkeyTypes.Request, res: Response, next: NextFunction) => {
    if (req.ctx.decodedToken.type === "ApeKey") {
      return customRateLimiter(req, res, next);
    }

    return defaultRateLimiter(req, res, next);
  };
}
