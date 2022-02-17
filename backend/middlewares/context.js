import ConfigurationDAO from "../dao/configuration";

async function contextMiddleware(req, _res, next) {
  const configuration = await ConfigurationDAO.getCachedConfiguration(true);

  req.ctx = {
    configuration,
    decodedToken: {
      uid: null,
    },
  };

  next();
}

export default contextMiddleware;
