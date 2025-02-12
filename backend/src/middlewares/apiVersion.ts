import { API_VERSION } from "@monkeytype/contracts";
import type {
  Response,
  NextFunction,
  Request as ExpressRequest,
} from "express";

/**
 * Add the X-API-VERSION header to each response
 * @param _req
 * @param res
 * @param next
 */
export async function apiVersionMiddleware(
  _req: ExpressRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  res.setHeader("X-Api-Version", API_VERSION);
  next();
}
