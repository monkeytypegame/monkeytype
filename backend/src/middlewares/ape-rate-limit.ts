import { customHandler } from "./rate-limit";
import { Response, NextFunction, RequestHandler } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

const REQUEST_MULTIPLIER = process.env.MODE === "dev" ? 100 : 1;

const getKey = (req: MonkeyTypes.Request, _res: Response): string => {
  return req?.ctx?.decodedToken?.uid;
};

const ONE_MINUTE = 1000 * 60;

const apeRateLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKey,
  handler: customHandler,
});

export function withApeRateLimiter(
  defaultRateLimiter: RateLimitRequestHandler
): RequestHandler {
  return (req: MonkeyTypes.Request, _res: Response, next: NextFunction) => {
    if (req.ctx.decodedToken.type === "ApeKey") {
      return apeRateLimiter(req, _res, next);
    }

    return defaultRateLimiter(req, _res, next);
  };
}
