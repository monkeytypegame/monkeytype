import _ from "lodash";
import MonkeyError from "../utils/error";
import type { Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import {
  rateLimit,
  RateLimitRequestHandler,
  type Options,
} from "express-rate-limit";
import { isDevEnvironment } from "../utils/misc";
import { EndpointMetadata } from "@monkeytype/contracts/schemas/api";
import { TsRestRequestWithCtx } from "./auth";
import { TsRestRequestHandler } from "@ts-rest/express";
import {
  limits,
  RateLimiterId,
  RateLimitOptions,
  Window,
} from "@monkeytype/contracts/rate-limit/index";
import statuses from "../constants/monkey-status-codes";

export const REQUEST_MULTIPLIER = isDevEnvironment() ? 100 : 1;

export const customHandler = (
  req: MonkeyTypes.ExpressRequestWithContext,
  _res: Response,
  _next: NextFunction,
  _options: Options
): void => {
  if (req.ctx.decodedToken.type === "ApeKey") {
    throw new MonkeyError(
      statuses.APE_KEY_RATE_LIMIT_EXCEEDED.code,
      statuses.APE_KEY_RATE_LIMIT_EXCEEDED.message
    );
  }
  throw new MonkeyError(429, "Request limit reached, please try again later.");
};

const getKey = (req: MonkeyTypes.Request, _res: Response): string => {
  return (
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string) ||
    (req.ip as string) ||
    "255.255.255.255"
  );
};

const getKeyWithUid = (req: MonkeyTypes.Request, _res: Response): string => {
  const uid = req?.ctx?.decodedToken?.uid;
  const useUid = uid !== undefined && uid !== "";

  return useUid ? uid : getKey(req, _res);
};

function initialiseLimiters(): Record<RateLimiterId, RateLimitRequestHandler> {
  const keys = Object.keys(limits) as RateLimiterId[];

  const convert = (options: RateLimitOptions): RateLimitRequestHandler => {
    return rateLimit({
      windowMs: convertWindowToMs(options.window),
      max: options.max * REQUEST_MULTIPLIER,
      handler: customHandler,
      keyGenerator: getKeyWithUid,
    });
  };

  return keys.reduce(
    (output, key) => ({ ...output, [key]: convert(limits[key]) }),
    {}
  ) as Record<RateLimiterId, RateLimitRequestHandler>;
}

function convertWindowToMs(window: Window): number {
  if (typeof window === "number") return window;
  switch (window) {
    case "second":
      return 1000;
    case "minute":
      return 60 * 1000;
    case "hour":
      return 60 * 60 * 1000;
    case "day":
      return 24 * 60 * 60 * 1000;
  }
}

//visible for testing
export const requestLimiters: Record<RateLimiterId, RateLimitRequestHandler> =
  initialiseLimiters();

export function rateLimitRequest<
  T extends AppRouter | AppRoute
>(): TsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithCtx,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const rateLimit = (req.tsRestRoute["metadata"] as EndpointMetadata)
      ?.rateLimit;
    if (rateLimit === undefined) {
      next();
      return;
    }

    const hasApeKeyLimiterId = typeof rateLimit === "object";
    let rateLimiterId: RateLimiterId;

    if (req.ctx.decodedToken.type === "ApeKey") {
      rateLimiterId = hasApeKeyLimiterId
        ? rateLimit.apeKey
        : "defaultApeRateLimit";
    } else {
      rateLimiterId = hasApeKeyLimiterId ? rateLimit.normal : rateLimit;
    }

    const rateLimiter = requestLimiters[rateLimiterId];
    if (rateLimiter === undefined) {
      next(
        new MonkeyError(
          500,
          `Unknown rateLimiterId '${rateLimiterId}', how did you manage to do this?`
        )
      );
    } else {
      rateLimiter(req, res, next);
    }
  };
}

// Root Rate Limit
export const rootRateLimiter = rateLimit({
  windowMs: 60 * 1000 * 60,
  max: 1000 * REQUEST_MULTIPLIER,
  keyGenerator: getKey,
  handler: (_req, _res, _next, _options): void => {
    throw new MonkeyError(
      429,
      "Maximum API request (root) limit reached. Please try again later."
    );
  },
});

// Bad Authentication Rate Limiter
const badAuthRateLimiter = new RateLimiterMemory({
  points: 30 * REQUEST_MULTIPLIER,
  duration: 60 * 60, //one hour seconds
});

export async function badAuthRateLimiterHandler(
  req: MonkeyTypes.Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const badAuthEnabled =
    req?.ctx?.configuration?.rateLimiting?.badAuthentication?.enabled;
  if (!badAuthEnabled) {
    next();
    return;
  }

  try {
    const key = getKey(req, res);
    const rateLimitStatus = await badAuthRateLimiter.get(key);

    if (rateLimitStatus !== null && rateLimitStatus?.remainingPoints <= 0) {
      throw new MonkeyError(
        429,
        "Too many bad authentication attempts, please try again later."
      );
    }
  } catch (error) {
    next(error);
    return;
  }

  next();
}

export async function incrementBadAuth(
  req: MonkeyTypes.Request,
  res: Response,
  status: number
): Promise<void> {
  const { enabled, penalty, flaggedStatusCodes } =
    req?.ctx?.configuration?.rateLimiting?.badAuthentication ?? {};

  if (!enabled || !flaggedStatusCodes.includes(status)) {
    return;
  }

  try {
    const key = getKey(req, res);
    await badAuthRateLimiter.penalty(key, penalty);
  } catch (error) {}
}

export const webhookLimit = rateLimit({
  windowMs: 1000,
  max: 1 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});
