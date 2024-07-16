import _ from "lodash";
import MonkeyError from "../utils/error";
import { Response, NextFunction, RequestHandler } from "express";
import { getUser } from "../dal/user";
import { isAdmin } from "../dal/admin-uids";
import { ValidationOptions } from "./configuration";

/**
 * Check if the user is an admin before handling request.
 * Note that this middleware must be used after authentication in the middleware stack.
 */
export function checkIfUserIsAdmin(): RequestHandler {
  return async (
    req: MonkeyTypes.Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const { uid } = req.ctx.decodedToken;
      const admin = await isAdmin(uid);

      if (!admin) {
        throw new MonkeyError(403, "You don't have permission to do this.");
      }
    } catch (error) {
      next(error);
    }

    next();
  };
}

/**
 * Check user permissions before handling request.
 * Note that this middleware must be used after authentication in the middleware stack.
 */
export function checkUserPermissions(
  options: ValidationOptions<MonkeyTypes.DBUser>
): RequestHandler {
  const { criteria, invalidMessage = "You don't have permission to do this." } =
    options;

  return async (
    req: MonkeyTypes.Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const { uid } = req.ctx.decodedToken;

      const userData = await getUser(uid, "check user permissions");
      const hasPermission = criteria(userData);

      if (!hasPermission) {
        throw new MonkeyError(403, invalidMessage);
      }
    } catch (error) {
      next(error);
    }

    next();
  };
}
