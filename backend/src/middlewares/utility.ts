import _ from "lodash";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { recordClientVersion as prometheusRecordClientVersion } from "../utils/prometheus";
import { isDevEnvironment } from "../utils/misc";
import MonkeyError from "../utils/error";
import { TsRestRequestWithCtx } from "./auth";

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
export function onlyAvailableOnDev(): MonkeyTypes.RequestHandler {
  return (_req: TsRestRequestWithCtx, _res: Response, next: NextFunction) => {
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
