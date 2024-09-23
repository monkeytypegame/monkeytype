import { getCachedConfiguration } from "../init/configuration";
import type {
  Response,
  NextFunction,
  Request as ExpressRequest,
} from "express";
import { DecodedToken } from "./auth";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import { ExpressRequestWithContext } from "../api/types";

export type Context = {
  configuration: Configuration;
  decodedToken: DecodedToken;
};

/**
 * Add the context to the request
 * @param req
 * @param _res
 * @param next
 */
async function contextMiddleware(
  req: ExpressRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const configuration = await getCachedConfiguration(true);

  (req as ExpressRequestWithContext).ctx = {
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
