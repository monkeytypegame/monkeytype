import MonkeyError from "../handlers/error";
import { verifyIdToken } from "../handlers/auth";

const DEFAULT_OPTIONS = {
  isPublic: false,
  acceptMonkeyTokens: false,
};

function authenticateRequest(options = DEFAULT_OPTIONS) {
  return async (req, _res, next) => {
    try {
      const { authorization: authHeader } = req.headers;
      let token = null;

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

      req.ctx.decodedToken = token;
    } catch (error) {
      return next(error);
    }

    next();
  };
}

function authenticateWithBody(body) {
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

async function authenticateWithAuthHeader(authHeader, options) {
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

async function authenticateWithBearerToken(token) {
  try {
    return await verifyIdToken(token);
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

async function authenticateWithMonkeyToken(token, options) {
  if (!options.acceptMonkeyTokens) {
    throw new MonkeyError(401, "This endpoint does not accept MonkeyTokens.");
  }

  throw new MonkeyError(401, "MonkeyTokens are not implemented.");
}

export { authenticateRequest };
