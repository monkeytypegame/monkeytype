import { Application } from "express";
import { getMiddleware as getSwaggerMiddleware } from "swagger-stats";
import internalSwaggerSpec from "../../documentation/internal-swagger.json";
import { isDevEnvironment } from "../../utils/misc";

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
}

export default addSwaggerMiddlewares;
