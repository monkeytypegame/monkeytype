import { compare } from "bcrypt";
import ApeKeysDAO from "../dao/ape-keys";
import MonkeyError from "../utils/error";
import { verifyIdToken } from "../utils/auth";
import { base64UrlDecode } from "../utils/misc";
import { NextFunction, Response, Handler } from "express";
import statuses from "../constants/monkey-status-codes";

interface RequestAuthenticationOptions {
  isPublic?: boolean;
  acceptApeKeys?: boolean;
}

const DEFAULT_OPTIONS: RequestAuthenticationOptions = {
  isPublic: false,
  acceptApeKeys: false,
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
    try {
      const { authorization: authHeader } = req.headers;
      let token: MonkeyTypes.DecodedToken;

      if (authHeader) {
        token = await authenticateWithAuthHeader(
          authHeader,
          req.ctx.configuration,
          options
        );
      } else if (options.isPublic) {
        return next();
      } else if (process.env.MODE === "dev") {
        token = authenticateWithBody(req.body);
      } else {
        throw new MonkeyError(
          401,
          "Unauthorized",
          `endpoint: ${req.baseUrl} no authorization header found`
        );
      }

      req.ctx = {
        ...req.ctx,
        decodedToken: token,
      };
    } catch (error) {
      return next(error);
    }

    next();
  };
}

function authenticateWithBody(
  body: MonkeyTypes.Request["body"]
): MonkeyTypes.DecodedToken {
  const { uid } = body;

  if (!uid) {
    throw new MonkeyError(
      401,
      "Running authorization in dev mode but still no uid was provided"
    );
  }

  return {
    type: "Bearer",
    uid,
    email: "",
  };
}

async function authenticateWithAuthHeader(
  authHeader: string,
  configuration: MonkeyTypes.Configuration,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  const token = authHeader.split(" ");

  const authScheme = token[0].trim();
  const credentials = token[1];

  switch (authScheme) {
    case "Bearer":
      return await authenticateWithBearerToken(credentials);
    case "ApeKey":
      return await authenticateWithApeKey(credentials, configuration, options);
  }

  throw new MonkeyError(
    401,
    "Unknown authentication scheme",
    `The authentication scheme "${authScheme}" is not implemented`
  );
}

async function authenticateWithBearerToken(
  token: string
): Promise<MonkeyTypes.DecodedToken> {
  try {
    const decodedToken = await verifyIdToken(token);

    return {
      type: "Bearer",
      uid: decodedToken.uid,
      email: decodedToken.email ?? "",
    };
  } catch (error) {
    console.log("-----------");
    console.log(error.errorInfo.code);
    console.log("-----------");

    if (error?.errorInfo?.code?.includes("auth/id-token-expired")) {
      throw new MonkeyError(
        401,
        "Token expired. Please login again.",
        "authenticateWithBearerToken"
      );
    } else if (error?.errorInfo?.code?.includes("auth/id-token-revoked")) {
      throw new MonkeyError(
        401,
        "Token revoked. Please login again.",
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
    throw new MonkeyError(403, "ApeKeys are not being accepted at this time");
  }

  if (!options.acceptApeKeys) {
    throw new MonkeyError(401, "This endpoint does not accept ApeKeys");
  }

  try {
    const decodedKey = base64UrlDecode(key);
    const [keyId, apeKey] = decodedKey.split(".");

    const targetApeKey = await ApeKeysDAO.getApeKey(keyId);
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

    await ApeKeysDAO.updateLastUsedOn(targetApeKey.uid, keyId);

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
