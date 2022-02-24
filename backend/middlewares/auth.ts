import MonkeyError from "../handlers/error";
import { verifyIdToken } from "../handlers/auth";
import { NextFunction, Response, Handler } from "express";

interface RequestAuthenticationOptions {
  isPublic?: boolean;
  acceptMonkeyTokens?: boolean;
}

const DEFAULT_OPTIONS: RequestAuthenticationOptions = {
  isPublic: false,
  acceptMonkeyTokens: false,
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
      let token: MonkeyTypes.DecodedToken = {};

      if (authHeader) {
        token = await authenticateWithAuthHeader(authHeader, options);
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
      400,
      "Running authorization in dev mode but still no uid was provided"
    );
  }

  return {
    uid,
  };
}

async function authenticateWithAuthHeader(
  authHeader: string,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  const token = authHeader.split(" ");

  const authScheme = token[0].trim();
  const credentials = token[1];

  switch (authScheme) {
    case "Bearer":
      return await authenticateWithBearerToken(credentials);
    case "MonkeyToken":
      return await authenticateWithMonkeyToken(credentials, options);
  }

  throw new MonkeyError(
    401,
    "Unknown authentication scheme",
    `The authentication scheme "${authScheme}" is not implemented.`
  );
}

async function authenticateWithBearerToken(
  token: string
): Promise<MonkeyTypes.DecodedToken> {
  try {
    const decodedToken = await verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
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

async function authenticateWithMonkeyToken(
  token: string,
  options: RequestAuthenticationOptions
): Promise<MonkeyTypes.DecodedToken> {
  if (!options.acceptMonkeyTokens) {
    throw new MonkeyError(401, "This endpoint does not accept MonkeyTokens.");
  }

  throw new MonkeyError(401, "MonkeyTokens are not implemented.");
}

export { authenticateRequest };
