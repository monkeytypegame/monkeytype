import { compare } from "bcrypt";
import { getApeKey, updateLastUsedOn } from "../dal/ape-keys";
import MonkeyError from "../utils/error";
import { verifyIdToken } from "../utils/auth";
import { base64UrlDecode, isDevEnvironment } from "../utils/misc";
import { NextFunction, Response } from "express";
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
import {
  EndpointMetadata,
  RequestAuthenticationOptions,
} from "@monkeytype/contracts/util/api";
import { Configuration } from "@monkeytype/schemas/configuration";
import { getMetadata } from "./utility";
import { TsRestRequestWithContext } from "../api/types";

export type DecodedToken = {
  type: "Bearer" | "ApeKey" | "None" | "GithubWebhook";
  uid: string;
  email: string;
};

const DEFAULT_OPTIONS: RequestAuthenticationOptions = {
  isGithubWebhook: false,
  isPublic: false,
  acceptApeKeys: false,
  requireFreshToken: false,
  isPublicOnDev: false,
};

/**
 * Authenticate request based on the auth settings of the route.
 * By default a Bearer token with user authentication is required.
 * @returns
 */
export function authenticateTsRestRequest<
  T extends AppRouter | AppRoute,
>(): TsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithContext,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const options = {
      ...DEFAULT_OPTIONS,
      ...((getMetadata(req).authenticationOptions ?? {}) as EndpointMetadata),
    };

    const startTime = performance.now();
    let token: DecodedToken;
    let authType = "None";

    const isPublic =
      options.isPublic === true ||
      (options.isPublicOnDev && isDevEnvironment());

    const {
      authorization: authHeader,
      "x-hub-signature-256": githubWebhookHeader,
    } = req.headers;

    try {
      if (options.isGithubWebhook) {
        token = authenticateGithubWebhook(req, githubWebhookHeader);
      } else if (authHeader !== undefined && authHeader !== "") {
        token = await authenticateWithAuthHeader(
          authHeader,
          req.ctx.configuration,
          options,
        );
      } else if (isPublic === true) {
        token = {
          type: "None",
          uid: "",
          email: "",
        };
      } else {
        throw new MonkeyError(
          401,
          "Unauthorized",
          `endpoint: ${req.baseUrl} no authorization header found`,
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
        req,
      );

      next(error);
      return;
    }
    recordAuthTime(
      token.type,
      "success",
      Math.round(performance.now() - startTime),
      req,
    );

    const country = req.headers["cf-ipcountry"] as string;
    if (country) {
      recordRequestCountry(country, req);
    }

    // if (req.method !== "OPTIONS" && req?.ctx?.decodedToken?.uid) {
    //   recordRequestForUid(req.ctx.decodedToken.uid);
    // }

    next();
  };
}

async function authenticateWithAuthHeader(
  authHeader: string,
  configuration: Configuration,
  options: RequestAuthenticationOptions,
): Promise<DecodedToken> {
  const [authScheme, token] = authHeader.split(" ");

  if (token === undefined) {
    throw new MonkeyError(
      401,
      "Missing authentication token",
      "authenticateWithAuthHeader",
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
    `The authentication scheme "${authScheme}" is not implemented`,
  );
}

async function authenticateWithBearerToken(
  token: string,
  options: RequestAuthenticationOptions,
): Promise<DecodedToken> {
  try {
    const decodedToken = await verifyIdToken(
      token,
      (options.requireFreshToken ?? false) || (options.noCache ?? false),
    );

    if (options.requireFreshToken) {
      const now = Date.now();
      const tokenIssuedAt = new Date(decodedToken.iat * 1000).getTime();

      if (now - tokenIssuedAt > 60 * 1000) {
        throw new MonkeyError(
          401,
          "Unauthorized",
          `This endpoint requires a fresh token`,
        );
      }
    }

    return {
      type: "Bearer",
      uid: decodedToken.uid,
      email: decodedToken.email ?? "",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("An internal error has occurred")
    ) {
      throw new MonkeyError(
        503,
        "Firebase returned an internal error when trying to verify the token.",
        "authenticateWithBearerToken",
      );
    }

    // oxlint-disable-next-line no-unsafe-member-access
    const errorCode = error?.errorInfo?.code as string | undefined;

    if (errorCode?.includes("auth/id-token-expired")) {
      throw new MonkeyError(
        401,
        "Token expired - please login again",
        "authenticateWithBearerToken",
      );
    } else if (errorCode?.includes("auth/id-token-revoked")) {
      throw new MonkeyError(
        401,
        "Token revoked - please login again",
        "authenticateWithBearerToken",
      );
    } else if (errorCode?.includes("auth/user-not-found")) {
      throw new MonkeyError(
        404,
        "User not found",
        "authenticateWithBearerToken",
      );
    } else if (errorCode?.includes("auth/argument-error")) {
      throw new MonkeyError(
        400,
        "Incorrect Bearer token format",
        "authenticateWithBearerToken",
      );
    } else {
      throw error;
    }
  }
}

async function authenticateWithApeKey(
  key: string,
  configuration: Configuration,
  options: RequestAuthenticationOptions,
): Promise<DecodedToken> {
  const isPublic =
    options.isPublic === true || (options.isPublicOnDev && isDevEnvironment());

  if (!isPublic) {
    if (!configuration.apeKeys.acceptKeys) {
      throw new MonkeyError(503, "ApeKeys are not being accepted at this time");
    }

    if (!options.acceptApeKeys) {
      throw new MonkeyError(401, "This endpoint does not accept ApeKeys");
    }
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

async function authenticateWithUid(token: string): Promise<DecodedToken> {
  if (!isDevEnvironment()) {
    throw new MonkeyError(401, "Bearer type uid is not supported");
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

export function authenticateGithubWebhook(
  req: TsRestRequestWithContext,
  authHeader: string | string[] | undefined,
): DecodedToken {
  try {
    const webhookSecret = process.env["GITHUB_WEBHOOK_SECRET"];

    if (webhookSecret === undefined || webhookSecret === "") {
      throw new MonkeyError(500, "Missing Github Webhook Secret");
    }

    if (
      Array.isArray(authHeader) ||
      authHeader === undefined ||
      authHeader === ""
    ) {
      throw new MonkeyError(401, "Missing Github signature header");
    }

    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    const trusted = Buffer.from(`sha256=${signature}`, "ascii");
    const untrusted = Buffer.from(authHeader, "ascii");
    const isSignatureValid = crypto.timingSafeEqual(trusted, untrusted);

    if (!isSignatureValid) {
      throw new MonkeyError(401, "Github webhook signature invalid");
    }

    return {
      type: "GithubWebhook",
      uid: "",
      email: "",
    };
  } catch (error) {
    if (error instanceof MonkeyError) {
      throw error;
    }
    throw new MonkeyError(
      500,
      "Failed to authenticate Github webhook: " + (error as Error).message,
    );
  }
}
