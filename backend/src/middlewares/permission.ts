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
  PermissionId,
} from "@monkeytype/contracts/schemas/api";
import { isDevEnvironment } from "../utils/misc";

type RequestPermissionCheck = {
  type: "request";
  criteria: (
    req: TsRestRequestWithCtx,
    metadata: EndpointMetadata | undefined
  ) => Promise<boolean>;
  invalidMessage?: string;
};

type UserPermissionCheck = {
  type: "user";
  fields: (keyof MonkeyTypes.DBUser)[];
  criteria: (user: MonkeyTypes.DBUser) => boolean;
  invalidMessage?: string;
};

type PermissionCheck = UserPermissionCheck | RequestPermissionCheck;

function buildUserPermission<K extends keyof MonkeyTypes.DBUser>(
  fields: K[],
  criteria: (user: Pick<MonkeyTypes.DBUser, K>) => boolean,
  invalidMessage?: string
): UserPermissionCheck {
  return {
    type: "user",
    fields,
    criteria,
    invalidMessage: invalidMessage,
  };
}

const permissionChecks: Record<PermissionId, PermissionCheck> = {
  admin: {
    type: "request",
    criteria: async (req, metadata) =>
      await checkIfUserIsAdmin(
        req.ctx.decodedToken,
        metadata?.authenticationOptions
      ),
  },
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

export function verifyPermissions<
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
    const requiredPermissionIds = getRequiredPermissionIds(metadata);
    if (
      requiredPermissionIds === undefined ||
      requiredPermissionIds.length === 0
    ) {
      next();
      return;
    }

    const checks = requiredPermissionIds.map((id) => permissionChecks[id]);

    if (checks.some((it) => it === undefined)) {
      next(new MonkeyError(500, "Unknown permission id."));
      return;
    }

    //handle request checks
    const requestChecks = checks.filter((it) => it.type === "request");
    for (const check of requestChecks) {
      if (!(await check.criteria(req, metadata))) {
        next(
          new MonkeyError(
            403,
            check.invalidMessage ?? "You don't have permission to do this."
          )
        );
        return;
      }
    }

    //handle user checks
    const userChecks = checks.filter((it) => it.type === "user");
    const checkResult = await checkUserPermissions(
      req.ctx.decodedToken,
      userChecks
    );

    if (!checkResult.passed) {
      next(
        new MonkeyError(
          403,
          checkResult.invalidMessage ?? "You don't have permission to do this."
        )
      );
      return;
    }

    //all checks passed
    next();
    return;
  };
}

function getRequiredPermissionIds(
  metadata: EndpointMetadata | undefined
): PermissionId[] | undefined {
  if (metadata === undefined || metadata.requirePermission === undefined)
    return undefined;

  if (Array.isArray(metadata.requirePermission))
    return metadata.requirePermission;
  return [metadata.requirePermission];
}

async function checkIfUserIsAdmin(
  decodedToken: MonkeyTypes.DecodedToken | undefined,
  options: RequestAuthenticationOptions | undefined
): Promise<boolean> {
  if (decodedToken === undefined) return false;
  if (options?.isPublicOnDev && isDevEnvironment()) return true;

  return await isAdmin(decodedToken.uid);
}

type CheckResult =
  | {
      passed: true;
    }
  | {
      passed: false;
      invalidMessage?: string;
    };

async function checkUserPermissions(
  decodedToken: MonkeyTypes.DecodedToken | undefined,
  checks: UserPermissionCheck[]
): Promise<CheckResult> {
  if (checks === undefined || checks.length === 0) {
    return {
      passed: true,
    };
  }
  if (decodedToken === undefined) {
    return {
      passed: false,
      invalidMessage: "Failed to check permissions, authentication required.",
    };
  }

  const user = (await getPartialUser(
    decodedToken.uid,
    "check user permissions",
    checks.flatMap((it) => it.fields)
  )) as MonkeyTypes.DBUser;

  for (const check of checks) {
    if (!check.criteria(user))
      return {
        passed: false,
        invalidMessage: check.invalidMessage,
      };
  }

  return {
    passed: true,
  };
}
