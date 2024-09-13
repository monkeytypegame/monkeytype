import { getCachedConfiguration } from "../init/configuration";
import type { Response, NextFunction } from "express";

/**
 * Add the context to the request
 * @param req
 * @param _res
 * @param next
 */
async function contextMiddleware(
  req: MonkeyTypes.ExpressRequestWithContext,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const configuration = await getCachedConfiguration(true);

  req.ctx = {
    configuration,
    decodedToken: {
      type: "None",
      uid: "",
      email: "",
    },
  };

  next();
}

export default contextMiddleware;
