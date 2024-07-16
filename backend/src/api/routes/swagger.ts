import _ from "lodash";
import { Application } from "express";
import { getMiddleware as getSwaggerMiddleware } from "swagger-stats";
import {
  serve as serveSwagger,
  setup as setupSwaggerUi,
} from "swagger-ui-express";
import publicSwaggerSpec from "../../documentation/public-swagger.json";
import internalSwaggerSpec from "../../documentation/internal-swagger.json";
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

  app.use(
    ["/documentation", "/docs"],
    serveSwagger,
    setupSwaggerUi(publicSwaggerSpec, SWAGGER_UI_OPTIONS)
  );
}

export default addSwaggerMiddlewares;
