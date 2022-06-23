import _ from "lodash";
import { Application } from "express";
import swaggerStats from "swagger-stats";
import swaggerUi from "swagger-ui-express";
import publicSwaggerSpec from "../../documentation/public-swagger.json";
import internalSwaggerSpec from "../../documentation/internal-swagger.json";

const SWAGGER_UI_OPTIONS = {
  customCss: ".swagger-ui .topbar { display: none }",
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
      onResponseFinish: (_req, res, rrr) => {
        //@ts-ignore ignored because monkeyMessage doesnt exist in response
        rrr.http.response.message = res.monkeyMessage;
        if (process.env.MODE === "dev") {
          return;
        }
        const authHeader = rrr.http.request.headers?.authorization ?? "None";
        const authType = authHeader.split(" ");
        _.set(rrr.http.request, "headers.authorization", authType[0]);
        _.set(rrr.http.request, "headers['x-forwarded-for']", "");
      },
    })
  );

  app.use(
    ["/documentation", "/docs"],
    swaggerUi.serve,
    swaggerUi.setup(publicSwaggerSpec, SWAGGER_UI_OPTIONS)
  );
}

export default addSwaggerMiddlewares;
