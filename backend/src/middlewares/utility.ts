import type { Request, Response, NextFunction, RequestHandler } from "express";
import { recordClientVersion as prometheusRecordClientVersion } from "../utils/prometheus";
import { isDevEnvironment } from "../utils/misc";
import MonkeyError from "../utils/error";
import { EndpointMetadata } from "@monkeytype/contracts/util/api";
import { TsRestRequestWithContext } from "../api/types";

/**
 * record the client version from the `x-client-version`  or ` client-version` header to prometheus
 */
export function recordClientVersion(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const clientVersion =
      (req.headers["x-client-version"] as string) ||
      req.headers["client-version"];

    prometheusRecordClientVersion(clientVersion?.toString() ?? "unknown");

    next();
  };
}

/** Endpoint is only available in dev environment, else return 503. */
export function onlyAvailableOnDev(): RequestHandler {
  return (
    _req: TsRestRequestWithContext,
    _res: Response,
    next: NextFunction
  ) => {
    if (!isDevEnvironment()) {
      next(
        new MonkeyError(
          503,
          "Development endpoints are only available in DEV mode."
        )
      );
    } else {
      next();
    }
  };
}

export function getMetadata(req: TsRestRequestWithContext): EndpointMetadata {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (req.tsRestRoute["metadata"] ?? {}) as EndpointMetadata;
}

/**
 * The req.body property returns undefined when the body has not been parsed. In Express 4, it returns {} by default.
 * Restore the v4 behavior
 * @param req
 * @param _res
 * @param next
 */
export async function v4RequestBody(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (req.body === undefined) {
    req.body = {};
  }

  next();
}
