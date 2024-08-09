import { Request, Response, NextFunction, RequestHandler } from "express";
import { recordClientVersion as prometheusRecordClientVersion } from "../utils/prometheus";

export function recordClientVersion(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const clientVersion =
      (req.headers["x-client-version"] as string) ||
      req.headers["client-version"];

    prometheusRecordClientVersion(clientVersion?.toString() ?? "unknown");

    next();
  };
}
