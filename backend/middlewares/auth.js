const MonkeyError = require("../handlers/error");
const { verifyIdToken } = require("../handlers/auth");

module.exports = {
  async authenticateRequest(req, res, next) {
    try {
      if (process.env.MODE === "dev" && !req.headers.authorization) {
        if (req.body.uid) {
          req.decodedToken = {
            uid: req.body.uid,
          };
          console.log("Running authorization in dev mode");
          return next();
        } else {
          throw new MonkeyError(
            400,
            "Running authorization in dev mode but still no uid was provided"
          );
        }
      }
      const { authorization } = req.headers;
      if (!authorization)
        throw new MonkeyError(
          401,
          "Unauthorized",
          `endpoint: ${req.baseUrl} no authorization header found`
        );
      const token = authorization.split(" ");
      if (token[0].trim() !== "Bearer")
        return next(
          new MonkeyError(400, "Invalid Token", "Incorrect token type")
        );
      try {
        req.decodedToken = await verifyIdToken(token[1]);
      } catch (err) {
        if (err.message == "auth/id-token-expired") {
          new MonkeyError(401, "Unauthorized", "Token expired");
        } else {
          throw err;
        }
      }
      return next();
    } catch (e) {
      return next(e);
    }
  },
};
