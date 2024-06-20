import { generateOpenApi } from "@ts-rest/open-api";
import { Application } from "express";
import { getMiddleware as getSwaggerMiddleware } from "swagger-stats";
import * as swaggerUi from "swagger-ui-express";
import internalSwaggerSpec from "../../documentation/internal-swagger.json";
import publicSwaggerSpec from "../../documentation/public-swagger.json";
import { isDevEnvironment } from "../../utils/misc";
import { contract } from "shared/contract/index.contract";

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

  const openApiDocument = generateOpenApi(
    contract,
    {
      info: {
        title: "Monkeytype API",
        description:
          "Documentation for the public endpoints provided by the Monkeytype API server.\n\nNote that authentication is performed with the Authorization HTTP header in the format `Authorization: ApeKey YOUR_APE_KEY`\n\nThere is a rate limit of `30 requests per minute` across all endpoints with some endpoints being more strict. Rate limit rates are shared across all ape keys.",
        version: "2.0.0",
        termsOfService: "https://monkeytype.com/terms-of-service",
        contact: {
          name: "Support",
          email: "support@monkeytype.com",
        },
      },
    },
    { jsonQuery: true, setOperationId: "concatenated-path" }
  );
  app.use("/v2/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(openApiDocument);
  });
  app.use(
    "/v2/docs",
    swaggerUi.serveFiles(openApiDocument, options),
    swaggerUi.setup(openApiDocument, SWAGGER_UI_OPTIONS)
  );
}

export default addSwaggerMiddlewares;
