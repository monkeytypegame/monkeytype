import { Application } from "express";
import { getMiddleware as getSwaggerMiddleware } from "swagger-stats";
import * as swaggerUi from "swagger-ui-express";
import internalSwaggerSpec from "../../documentation/internal-swagger.json";
import publicSwaggerSpec from "../../documentation/public-swagger.json";
import { isDevEnvironment } from "../../utils/misc";

const SWAGGER_UI_OPTIONS = {
  customCss: ".swagger-ui .topbar { display: none } .try-out { display: none }",
  customSiteTitle: "Monkeytype API Documentation",
};

function addSwaggerMiddlewares(app: Application): void {
  app.use(
    getSwaggerMiddleware({
      name: "Monkeytype API",
      uriPath: "/stats",
      authentication: !isDevEnvironment(),
      apdexThreshold: 100,
      swaggerSpec: internalSwaggerSpec,
      onAuthenticate: (_req, username, password) => {
        return (
          username === process.env["STATS_USERNAME"] &&
          password === process.env["STATS_PASSWORD"]
        );
      },
    })
  );

  const options = {};
  app.use(
    ["/documentation", "/docs"],
    swaggerUi.serveFiles(publicSwaggerSpec, options),
    swaggerUi.setup(publicSwaggerSpec, SWAGGER_UI_OPTIONS)
  );
}

export default addSwaggerMiddlewares;
