import _ from "lodash";
import { Application } from "express";
import swaggerStats from "swagger-stats";
import swaggerUi from "swagger-ui-express";
import publicSwaggerSpec from "../../documentation/public-swagger.json";
import internalSwaggerSpec from "../../documentation/internal-swagger.json";
import { recordRequestCountry } from "../../utils/prometheus";

const SWAGGER_UI_OPTIONS = {
  customCss: ".swagger-ui .topbar { display: none } .try-out { display: none }",
  customSiteTitle: "Monkeytype API Documentation",
};

function addSwaggerMiddlewares(app: Application): void {
  app.use(
    swaggerStats.getMiddleware({
      name: "Monkeytype API",
      uriPath: "/stats",
      authentication: process.env.MODE !== "dev",
      apdexThreshold: 100,
      swaggerSpec: internalSwaggerSpec,
      onAuthenticate: (_req, username, password) => {
        return (
          username === process.env.STATS_USERNAME &&
          password === process.env.STATS_PASSWORD
        );
      },
    })
  );

  app.use(
    ["/documentation", "/docs"],
    swaggerUi.serve,
    swaggerUi.setup(publicSwaggerSpec, SWAGGER_UI_OPTIONS)
  );

  app.use((req, res, next) => {
    const country = req.headers["cf-ipcountry"] as string;
    if (country) {
      recordRequestCountry(country, req as MonkeyTypes.Request);
    }
    next();
  });
}

export default addSwaggerMiddlewares;
