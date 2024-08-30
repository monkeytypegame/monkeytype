import { Application } from "express";
import { getMiddleware as getSwaggerMiddleware } from "swagger-stats";
import { isDevEnvironment } from "../../utils/misc";
import { readFileSync } from "fs";
import Logger from "../../utils/logger";

function addSwaggerMiddlewares(app: Application): void {
  const openApiSpec = __dirname + "/../../static/api/openapi.json";
  let spec = {};
  try {
    spec = JSON.parse(readFileSync(openApiSpec, "utf8"));
  } catch (err) {
    Logger.warning(
      `Cannot read openApi specification from ${openApiSpec}. Swagger stats will not fully work.`
    );
  }

  app.use(
    getSwaggerMiddleware({
      name: "Monkeytype API",
      uriPath: "/stats",
      authentication: !isDevEnvironment(),
      apdexThreshold: 100,
      swaggerSpec: spec,
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
