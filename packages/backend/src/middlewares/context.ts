import MonkeyTypes from "@monkeytype/types";
import { NextFunction, Response } from "express";
import { getCachedConfiguration } from "../init/configuration";

async function contextMiddleware(
  req: MonkeyTypes.Request,
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
