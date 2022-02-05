const ConfigurationDAO = require("../dao/configuration");

async function contextMiddleware(req, res, next) {
  const configuration = await ConfigurationDAO.getCachedConfiguration(true);

  req.ctx = {
    configuration,
    decodedToken: {
      uid: null,
    },
  };

  next();
}

module.exports = contextMiddleware;
