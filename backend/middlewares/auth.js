const MonkeyError = require("../handlers/error");
const { verifyIdToken } = require("../handlers/auth");

const DEFAULT_OPTIONS = {
  isPublic: false,
};

function authenticateRequest(options = DEFAULT_OPTIONS) {
  return async (req, _res, next) => {
    try {
      const { authorization: authHeader } = req.headers;
      let token = null;

      if (authHeader) {
        token = await authenticateWithAuthHeader(authHeader);
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

async function authenticateWithAuthHeader(authHeader) {
  const token = authHeader.split(" ");

  const authScheme = token[0].trim();
  const credentials = token[1];

  if (authScheme === "Bearer") {
    return await authenticateWithBearerToken(credentials);
  }

  throw new MonkeyError(
    400,
    "Unknown authentication scheme",
    `The authentication scheme "${authScheme}" is not implemented.`
  );
}

async function authenticateWithBearerToken(token) {
  try {
    return await verifyIdToken(token);
  } catch (error) {
    if (error.message.includes("auth/id-token-expired")) {
      throw new MonkeyError(401, "Unauthorized", "Token expired");
    } else {
      throw error;
    }
  }
}

module.exports = {
  authenticateRequest,
};
