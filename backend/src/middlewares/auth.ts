import { compare } from "bcrypt";
import { getApeKey, updateLastUsedOn } from "../dal/ape-keys";
import MonkeyError from "../utils/error";
import { verifyIdToken } from "../utils/auth";
import { base64UrlDecode, isDevEnvironment } from "../utils/misc";
import { NextFunction, Response, Handler } from "express";
import statuses from "../constants/monkey-status-codes";
import {
  incrementAuth,
  recordAuthTime,
  recordRequestCountry,
} from "../utils/prometheus";
import crypto from "crypto";
import { performance } from "perf_hooks";
import { TsRestRequestHandler } from "@ts-rest/express";
import { AppRoute, AppRouter } from "@ts-rest/core";
import { RequestAuthenticationOptions } from "@monkeytype/contracts/schemas/api";
import { Configuration } from "@monkeytype/shared-types";

const DEFAULT_OPTIONS: RequestAuthenticationOptions = {
  isPublic: false,
  acceptApeKeys: false,
  requireFreshToken: false,
};

export type TsRestRequestWithCtx = {
  ctx: Readonly<MonkeyTypes.Context>;
} & TsRestRequest;

/**
 * Authenticate request based on the auth settings of the route.
 * By default a Bearer token with user authentication is required.
 * @returns
 */
export function authenticateTsRestRequest<
  T extends AppRouter | AppRoute
>(): TsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithCtx,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const options = {
      ...DEFAULT_OPTIONS,
      ...(req.tsRestRoute["metadata"]?.["authenticationOptions"] ?? {}),
    };
    return _authenticateRequestInternal(req, _res, next, options);
  };
}

export function authenticateRequest(authOptions = DEFAULT_OPTIONS): Handler {
  const options = {
    ...DEFAULT_OPTIONS,
    ...authOptions,
  };

  return async (
    req: MonkeyTypes.Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    return _authenticateRequestInternal(req, _res, next, options);
  };
}

async function _authenticateRequestInternal(
  req: MonkeyTypes.Request | TsRestRequestWithCtx,
  _res: Response,
  next: NextFunction,
  options: RequestAuthenticationOptions
): Promise<void> {
  const startTime = performance.now();
  let token: MonkeyTypes.DecodedToken;
  let authType = "None";

  const { authorization: authHeader } = req.headers;

  try {
    if (authHeader !== undefined && authHeader !== "") {
      token = await authenticateWithAuthHeader(
        authHeader,
        req.ctx.configuration,
        options
      );
    } else if (options.isPublic === true) {
      token = {
        type: "None",
        uid: "",
        email: "",
      };
    } else {
      throw new MonkeyError(
        401,
        "Unauthorized",
        `endpoint: ${req.baseUrl} no authorization header found`
      );
    }

    incrementAuth(token.type);

    req.ctx = {
      ...req.ctx,
      decodedToken: token,
    };
  } catch (error) {
    authType = authHeader?.split(" ")[0] ?? "None";

    recordAuthTime(
      authType,
      "failure",
      Math.round(performance.now() - startTime),
      req
    );

    return next(error);
  }
  recordAuthTime(
    token.type,
    "success",
    Math.round(performance.now() - startTime),
    req
  );

  const country = req.headers["cf-ipcountry"] as string;
  if (country) {
    recordRequestCountry(country, req);
  }

  // if (req.method !== "OPTIONS" && req?.ctx?.decodedToken?.uid) {
  //   recordRequestForUid(req.ctx.decodedToken.uid);
  // }

  next();
}

async function authenticateWithAuthHeader(
  authHeader: string,
  configuration: Configuration,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  const [authScheme, token] = authHeader.split(" ");

  if (token === undefined) {
    throw new MonkeyError(
      401,
      "Missing authentication token",
      "authenticateWithAuthHeader"
    );
  }

  const normalizedAuthScheme = authScheme?.trim();

  switch (normalizedAuthScheme) {
    case "Bearer":
      return await authenticateWithBearerToken(token, options);
    case "ApeKey":
      return await authenticateWithApeKey(token, configuration, options);
    case "Uid":
      return await authenticateWithUid(token);
  }

  throw new MonkeyError(
    401,
    "Unknown authentication scheme",
    `The authentication scheme "${authScheme}" is not implemented`
  );
}

async function authenticateWithBearerToken(
  token: string,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  try {
    const decodedToken = await verifyIdToken(
      token,
      (options.requireFreshToken ?? false) || (options.noCache ?? false)
    );

    if (options.requireFreshToken) {
      const now = Date.now();
      const tokenIssuedAt = new Date(decodedToken.iat * 1000).getTime();

      if (now - tokenIssuedAt > 60 * 1000) {
        throw new MonkeyError(
          401,
          "Unauthorized",
          `This endpoint requires a fresh token`
        );
      }
    }

    return {
      type: "Bearer",
      uid: decodedToken.uid,
      email: decodedToken.email ?? "",
    };
  } catch (error) {
    const errorCode = error?.errorInfo?.code;

    if (errorCode?.includes("auth/id-token-expired") as boolean | undefined) {
      throw new MonkeyError(
        401,
        "Token expired - please login again",
        "authenticateWithBearerToken"
      );
    } else if (
      errorCode?.includes("auth/id-token-revoked") as boolean | undefined
    ) {
      throw new MonkeyError(
        401,
        "Token revoked - please login again",
        "authenticateWithBearerToken"
      );
    } else if (
      errorCode?.includes("auth/user-not-found") as boolean | undefined
    ) {
      throw new MonkeyError(
        404,
        "User not found",
        "authenticateWithBearerToken"
      );
    } else if (
      errorCode?.includes("auth/argument-error") as boolean | undefined
    ) {
      throw new MonkeyError(
        400,
        "Incorrect Bearer token format",
        "authenticateWithBearerToken"
      );
    } else {
      throw error;
    }
  }
}

async function authenticateWithApeKey(
  key: string,
  configuration: Configuration,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  if (!configuration.apeKeys.acceptKeys) {
    throw new MonkeyError(503, "ApeKeys are not being accepted at this time");
  }

  if (!options.acceptApeKeys && !options.isPublic) {
    throw new MonkeyError(401, "This endpoint does not accept ApeKeys");
  }

  try {
    const decodedKey = base64UrlDecode(key);
    const [keyId, apeKey] = decodedKey.split(".");

    if (
      keyId === undefined ||
      keyId === "" ||
      apeKey === undefined ||
      apeKey === ""
    ) {
      throw new MonkeyError(400, "Malformed ApeKey");
    }

    const targetApeKey = await getApeKey(keyId);
    if (!targetApeKey) {
      throw new MonkeyError(404, "ApeKey not found");
    }

    if (!targetApeKey.enabled) {
      const { code, message } = statuses.APE_KEY_INACTIVE;
      throw new MonkeyError(code, message);
    }

    const isKeyValid = await compare(apeKey, targetApeKey.hash);
    if (!isKeyValid) {
      const { code, message } = statuses.APE_KEY_INVALID;
      throw new MonkeyError(code, message);
    }

    await updateLastUsedOn(targetApeKey.uid, keyId);

    return {
      type: "ApeKey",
      uid: targetApeKey.uid,
      email: "",
    };
  } catch (error) {
    if (!(error instanceof MonkeyError)) {
      const { code, message } = statuses.APE_KEY_MALFORMED;
      throw new MonkeyError(code, message);
    }

    throw error;
  }
}

async function authenticateWithUid(
  token: string
): Promise<MonkeyTypes.DecodedToken> {
  if (!isDevEnvironment()) {
    throw new MonkeyError(401, "Baerer type uid is not supported");
  }
  const [uid, email] = token.split("|");

  if (uid === undefined || uid === "") {
    throw new MonkeyError(401, "Missing uid");
  }

  return {
    type: "Bearer",
    uid: uid,
    email: email ?? "",
  };
}

export function authenticateGithubWebhook(): Handler {
  return async (
    req: MonkeyTypes.Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    //authorize github webhook
    const { "x-hub-signature-256": authHeader } = req.headers;

    const webhookSecret = process.env["GITHUB_WEBHOOK_SECRET"];

    try {
      if (webhookSecret === undefined || webhookSecret === "") {
        throw new MonkeyError(500, "Missing Github Webhook Secret");
      } else if (
        authHeader === undefined ||
        authHeader === "" ||
        authHeader.length === 0
      ) {
        throw new MonkeyError(401, "Missing Github signature header");
      } else {
        const signature = crypto
          .createHmac("sha256", webhookSecret)
          .update(JSON.stringify(req.body))
          .digest("hex");
        const trusted = Buffer.from(`sha256=${signature}`, "ascii");
        const untrusted = Buffer.from(authHeader as string, "ascii");
        const isSignatureValid = crypto.timingSafeEqual(trusted, untrusted);

        if (!isSignatureValid) {
          throw new MonkeyError(401, "Github webhook signature invalid");
        }
      }
    } catch (e) {
      return next(e);
    }

    next();
  };
}
