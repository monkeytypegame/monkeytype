const express = require("express");
const cors = require("cors");
const addApiRoutes = require("./api/routes");
const contextMiddleware = require("./middlewares/context");
const errorHandlingMiddleware = require("./middlewares/error");

function buildApp() {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors());

  app.set("trust proxy", 1);

  app.use(contextMiddleware);

  addApiRoutes(app);

  app.use(errorHandlingMiddleware);

  return app;
}

module.exports = buildApp();
