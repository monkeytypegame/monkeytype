import { compare } from "bcrypt";
import { getApeKey, updateLastUsedOn } from "../dal/ape-keys";
import MonkeyError from "../utils/error";
import { verifyIdToken } from "../utils/auth";
import { base64UrlDecode } from "../utils/misc";
import { NextFunction, Response, Handler } from "express";
import statuses from "../constants/monkey-status-codes";
import {
  incrementAuth,
  recordAuthTime,
  recordRequestCountry,
  // recordRequestForUid,
} from "../utils/prometheus";
import { performance } from "perf_hooks";

interface RequestAuthenticationOptions {
  isPublic?: boolean;
  acceptApeKeys?: boolean;
  requireFreshToken?: boolean;
}

const DEFAULT_OPTIONS: RequestAuthenticationOptions = {
  isPublic: false,
  acceptApeKeys: false,
  requireFreshToken: false,
};

function authenticateRequest(authOptions = DEFAULT_OPTIONS): Handler {
  const options = {
    ...DEFAULT_OPTIONS,
    ...authOptions,
  };

  return async (
    req: MonkeyTypes.Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const startTime = performance.now();
    let token: MonkeyTypes.DecodedToken;
    let authType = "None";

    const { authorization: authHeader } = req.headers;

    try {
      if (authHeader) {
        token = await authenticateWithAuthHeader(
          authHeader,
          req.ctx.configuration,
          options
        );
      } else if (options.isPublic) {
        token = {
          type: "None",
          uid: "",
          email: "",
        };
      } else if (process.env.MODE === "dev") {
        token = authenticateWithBody(req.body);
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
      recordRequestCountry(country, req as MonkeyTypes.Request);
    }

    // if (req.method !== "OPTIONS" && req?.ctx?.decodedToken?.uid) {
    //   recordRequestForUid(req.ctx.decodedToken.uid);
    // }

    next();
  };
}

function authenticateWithBody(
  body: MonkeyTypes.Request["body"]
): MonkeyTypes.DecodedToken {
  const { uid, email } = body;

  if (!uid) {
    throw new MonkeyError(
      401,
      "Running authorization in dev mode but still no uid was provided"
    );
  }

  return {
    type: "Bearer",
    uid,
    email: email ?? "",
  };
}

async function authenticateWithAuthHeader(
  authHeader: string,
  configuration: MonkeyTypes.Configuration,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  const [authScheme, token] = authHeader.split(" ");
  const normalizedAuthScheme = authScheme.trim();

  switch (normalizedAuthScheme) {
    case "Bearer":
      return await authenticateWithBearerToken(token, options);
    case "ApeKey":
      return await authenticateWithApeKey(token, configuration, options);
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
    const decodedToken = await verifyIdToken(token, options.requireFreshToken);

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

    if (errorCode?.includes("auth/id-token-expired")) {
      throw new MonkeyError(
        401,
        "Token expired. Please login again.",
        "authenticateWithBearerToken"
      );
    } else if (errorCode?.includes("auth/id-token-revoked")) {
      throw new MonkeyError(
        401,
        "Token revoked. Please login again.",
        "authenticateWithBearerToken"
      );
    } else if (errorCode?.includes("auth/user-not-found")) {
      throw new MonkeyError(
        404,
        "User not found.",
        "authenticateWithBearerToken"
      );
    } else if (errorCode?.includes("auth/argument-error")) {
      throw new MonkeyError(
        400,
        "Incorrect Bearer token format.",
        "authenticateWithBearerToken"
      );
    } else {
      throw error;
    }
  }
}

async function authenticateWithApeKey(
  key: string,
  configuration: MonkeyTypes.Configuration,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  if (!configuration.apeKeys.acceptKeys) {
    throw new MonkeyError(503, "ApeKeys are not being accepted at this time");
  }

  if (!options.acceptApeKeys) {
    throw new MonkeyError(401, "This endpoint does not accept ApeKeys");
  }

  try {
    const decodedKey = base64UrlDecode(key);
    const [keyId, apeKey] = decodedKey.split(".");

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

export { authenticateRequest };
