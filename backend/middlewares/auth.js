const MonkeyError = require("../handlers/error");
const { verifyIdToken } = require("../handlers/auth");

module.exports = {
  async authenticateRequest(req, res, next) {
    console.log();
    try {
      const { authorization } = req.headers;
      if (!authorization)
        throw new MonkeyError(
          401,
          "Unauthorized",
          `endpoint: ${req.baseUrl} no authrizaion header found`
        );
      const token = authorization.split(" ");
      if (token[0].trim() !== "Bearer")
        return next(
          new MonkeyError(400, "Invalid Token", "Incorrect token type")
        );
      req.decodedToken = await verifyIdToken(token[1]);
      return next();
    } catch (e) {
      return next(e);
    }
  },
};
