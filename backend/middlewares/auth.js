const { verifyIdToken } = require("../handlers/auth");

module.exports = {
  async authenticateRequest(req, res, next) {
    try {
      const { authorization } = req.headers;
      if (!authorization) return next("Unauthorized");
      const token = authorization.split(" ");
      if (token[0] !== "Bearer ") return next("Invalid token");
      req.decodedToken = await verifyIdToken(token[1]);
      return next();
    } catch (e) {
      return next(e);
    }
  },
};
