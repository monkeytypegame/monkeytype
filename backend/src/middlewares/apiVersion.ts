import { API_VERSION, API_VERSION_HEADER } from "@monkeytype/contracts";
import type { Response, NextFunction, Request } from "express";

/**
 * Add the X-API-VERSION header to each response
 * @param _req
 * @param res
 * @param next
 */
export async function apiVersionMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  res.setHeader(API_VERSION_HEADER, API_VERSION);
  next();
}
