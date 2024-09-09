import _ from "lodash";
import MonkeyError from "../utils/error";
import type { Response, NextFunction } from "express";
import { getPartialUser } from "../dal/user";
import { isAdmin } from "../dal/admin-uids";
import { TsRestRequestHandler } from "@ts-rest/express";
import { TsRestRequestWithCtx } from "./auth";
import {
  EndpointMetadata,
  RequestAuthenticationOptions,
  Role,
  UserPermission,
} from "@monkeytype/contracts/schemas/api";
import { isDevEnvironment } from "../utils/misc";

type UserPermissionCheck = {
  fields: (keyof MonkeyTypes.DBUser)[];
  criteria: (user: MonkeyTypes.DBUser) => boolean;
  invalidMessage: string;
};

function buildUserPermission<K extends keyof MonkeyTypes.DBUser>(
  fields: K[],
  criteria: (user: Pick<MonkeyTypes.DBUser, K>) => boolean,
  invalidMessage?: string
): UserPermissionCheck {
  return {
    fields,
    criteria,
    invalidMessage: invalidMessage ?? "You don't have permission to do this.",
  };
}

const permissionChecks: Record<UserPermission, UserPermissionCheck> = {
  quoteMod: buildUserPermission(
    ["quoteMod"],
    (user) =>
      user.quoteMod === true ||
      (typeof user.quoteMod === "string" && user.quoteMod !== "")
  ),

  canReport: buildUserPermission(
    ["canReport"],
    (user) => user.canReport !== false
  ),
  canManageApeKeys: buildUserPermission(
    ["canManageApeKeys"],
    (user) => user.canManageApeKeys ?? true,
    "You have lost access to ape keys, please contact support"
  ),
};

export function checkRequiredRole<
  T extends AppRouter | AppRoute
>(): TsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithCtx,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const metadata = req.tsRestRoute["metadata"] as
      | EndpointMetadata
      | undefined;
    const requiredRoles = getRequiredRoles(metadata);
    if (requiredRoles === undefined) {
      next();
      return;
    }

    if (requiredRoles.includes("admin")) {
      if (
        !(await checkIfUserIsAdmin(
          req.ctx.decodedToken,
          metadata?.authenticationOptions
        ))
      ) {
        next(new MonkeyError(403, "You don't have permission to do this."));
        return;
      }
    }

    const invalidMessage = await checkUserPermissions(
      req.ctx.decodedToken,
      requiredRoles.filter((it) => it !== "admin")
    );
    if (invalidMessage !== undefined) {
      next(new MonkeyError(403, invalidMessage));
      return;
    }

    //all checks passed
    next();
    return;
  };
}

function getRequiredRoles(
  metadata: EndpointMetadata | undefined
): Role[] | undefined {
  if (metadata === undefined || metadata.requireRole === undefined)
    return undefined;

  if (Array.isArray(metadata.requireRole)) return metadata.requireRole;
  return [metadata.requireRole];
}

async function checkIfUserIsAdmin(
  decodedToken: MonkeyTypes.DecodedToken | undefined,
  options: RequestAuthenticationOptions | undefined
): Promise<boolean> {
  if (decodedToken === undefined) return false;
  if (options?.isPublicOnDev && isDevEnvironment()) return true;

  return await isAdmin(decodedToken.uid);
}

async function checkUserPermissions(
  decodedToken: MonkeyTypes.DecodedToken | undefined,
  roles: UserPermission[]
): Promise<string | undefined> {
  if (roles === undefined || roles.length === 0) return undefined;
  if (decodedToken === undefined) return "Authentication missing.";

  const checks = roles.map((it) => permissionChecks[it]);

  const user = (await getPartialUser(
    decodedToken.uid,
    "check user permissions",
    checks.flatMap((it) => it.fields)
  )) as MonkeyTypes.DBUser;

  for (const check of checks) {
    if (!check.criteria(user)) return check.invalidMessage;
  }
  return undefined;
}
