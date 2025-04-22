import { Application } from "express";
import { getMiddleware as getSwaggerMiddleware } from "swagger-stats";
import { isDevEnvironment } from "../../utils/misc";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { readFileSync } from "fs";
import Logger from "../../utils/logger";
import { z } from "zod";

function addSwaggerMiddlewares(app: Application): void {
  const openApiSpec = __dirname + "/../../../dist/static/api/openapi.json";
  let spec = {};
  try {
    // a schema that allows any object structure for OpenAPI spec
    const OpenApiSchema = z.record(z.any());
    spec = parseJsonWithSchema(
      readFileSync(openApiSpec, "utf8"),
      OpenApiSchema
    );
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
