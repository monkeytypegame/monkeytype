import {
  COMPATIBILITY_CHECK,
  COMPATIBILITY_CHECK_HEADER,
} from "@monkeytype/contracts";
import type { Response, NextFunction, Request } from "express";

/**
 * Add the COMPATIBILITY_CHECK_HEADER to each response
 * @param _req
 * @param res
 * @param next
 */
export async function compatibilityCheckMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  res.setHeader(COMPATIBILITY_CHECK_HEADER, COMPATIBILITY_CHECK);
  next();
}
