const MonkeyError = require("../handlers/error");
const { verifyIdToken } = require("../handlers/auth");

module.exports = {
  async authenticateRequest(req, res, next) {
    try {
      const { authorization } = req.headers;
      if (!authorization) throw new MonkeyError(401, "Unauthorized");
      const token = authorization.split(" ");
      if (token[0].trim() !== "Bearer")
        return next(new MonkeyError(400, "Invalid Token"));
      req.decodedToken = await verifyIdToken(token[1]);
      return next();
    } catch (e) {
      return next(e);
    }
  },
};
