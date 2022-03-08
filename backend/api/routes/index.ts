import _ from "lodash";
import users from "./users";
import configs from "./configs";
import results from "./results";
import presets from "./presets";
import psas from "./psas";
import leaderboards from "./leaderboards";
import quotes from "./quotes";
import apeKeys from "./ape-keys";
import { asyncHandler } from "../../middlewares/api-utils";
import { MonkeyResponse } from "../../utils/monkey-response";
import { Application, NextFunction, Response, Router } from "express";
import swStats from "swagger-stats";
import SwaggerSpec from "../../swagger.json";

const pathOverride = process.env.API_PATH_OVERRIDE;
const BASE_ROUTE = pathOverride ? `/${pathOverride}` : "";
const APP_START_TIME = Date.now();

const API_ROUTE_MAP = {
  "/users": users,
  "/configs": configs,
  "/results": results,
  "/presets": presets,
  "/psas": psas,
  "/leaderboards": leaderboards,
  "/quotes": quotes,
  "/ape-keys": apeKeys,
};

function addApiRoutes(app: Application): void {
  let requestsProcessed = 0;

  app.use(
    swStats.getMiddleware({
      name: "Monkeytype API",
      // hostname: process.env.MODE === "dev" ? "localhost": process.env.STATS_HOSTNAME,
      // ip: process.env.MODE === "dev" ? "127.0.0.1": process.env.STATS_IP,
      uriPath: "/stats",
      authentication: process.env.MODE !== "dev",
      apdexThreshold: 100,
      swaggerSpec: SwaggerSpec,
      onAuthenticate: (_req, username, password) => {
        return (
          username === process.env.STATS_USERNAME &&
          password === process.env.STATS_PASSWORD
        );
      },
      onResponseFinish: (_req, res, rrr) => {
        //@ts-ignore ignored because monkeyMessage doesnt exist on the type
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
    (req: MonkeyTypes.Request, res: Response, next: NextFunction): void => {
      const inMaintenance =
        process.env.MAINTENANCE === "true" || req.ctx.configuration.maintenance;

      if (inMaintenance) {
        res.status(503).json({ message: "Server is down for maintenance" });
        return;
      }

      requestsProcessed++;
      next();
    }
  );

  app.get(
    "/",
    asyncHandler(async (_req, _res) => {
      return new MonkeyResponse("ok", {
        uptime: Date.now() - APP_START_TIME,
        requestsProcessed,
      });
    })
  );

  app.get("/psa", (req, res) => {
    res.json([
      {
        message:
          "It seems like your client version is very out of date as you're requesting an API endpoint that no longer exists. This will likely cause most of the website to not function correctly. Please clear your cache, or contact support if this message persists.",
        sticky: true,
      },
    ]);
  });

  _.each(API_ROUTE_MAP, (router: Router, route) => {
    const apiRoute = `${BASE_ROUTE}${route}`;
    app.use(apiRoute, router);
  });

  app.use(
    asyncHandler(async (req, _res) => {
      return new MonkeyResponse(
        `Unknown request URL (${req.method}: ${req.path})`,
        null,
        404
      );
    })
  );
}

export default addApiRoutes;
