import _ from "lodash";
import MonkeyError from "../utils/error";
import type { Response, NextFunction, RequestHandler } from "express";
import { getPartialUser } from "../dal/user";
import { isAdmin } from "../dal/admin-uids";
import type { ValidationOptions } from "./configuration";
import { TsRestRequestHandler } from "@ts-rest/express";
import { TsRestRequestWithCtx } from "./auth";
import { RequestAuthenticationOptions } from "@monkeytype/contracts/schemas/api";
import { isDevEnvironment } from "../utils/misc";

/**
 * Check if the user is an admin before handling request.
 * Note that this middleware must be used after authentication in the middleware stack.
 */
export function checkIfUserIsAdmin<
  T extends AppRouter | AppRoute
>(): TsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithCtx,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const options: RequestAuthenticationOptions =
        req.tsRestRoute["metadata"]?.["authenticationOptions"] ?? {};

      if (options.isPublicOnDev && isDevEnvironment()) {
        next();
        return;
      }

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
export function checkUserPermissions<K extends keyof MonkeyTypes.DBUser>(
  fields: K[],
  options: ValidationOptions<Pick<MonkeyTypes.DBUser, K>>
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

      const userData = await getPartialUser(
        uid,
        "check user permissions",
        fields
      );
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
