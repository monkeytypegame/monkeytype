const ConfigurationDAO = require("../dao/configuration");

async function contextMiddleware(req, res, next) {
  const configuration = await ConfigurationDAO.getCachedConfiguration(true);

  req.context = {
    configuration,
  };

  next();
}

module.exports = contextMiddleware;
