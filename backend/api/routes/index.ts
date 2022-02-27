import users from "./users";
import configs from "./configs";
import results from "./results";
import presets from "./presets";
import psas from "./psas";
import leaderboards from "./leaderboards";
import quotes from "./quotes";
import { asyncHandler } from "../../middlewares/api-utils";
import { MonkeyResponse } from "../../handlers/monkey-response";
import { Application, NextFunction, Response } from "express";
import swStats from "swagger-stats";

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
};

function addApiRoutes(app: Application): void {
  let requestsProcessed = 0;

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

  app.use(
    swStats.getMiddleware({
      name: "Monkeytype API",
      // hostname: process.env.MODE === "dev" ? "localhost": process.env.STATS_HOSTNAME,
      // ip: process.env.MODE === "dev" ? "127.0.0.1": process.env.STATS_IP,
      uriPath: "/stats",
      authentication: process.env.MODE === "dev" ? false : true,
      onAuthenticate: function (req, username, password) {
        return (
          username === process.env.STATS_USERNAME &&
          password === process.env.STATS_PASSWORD
        );
      },
    })
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

  Object.keys(API_ROUTE_MAP).forEach((route) => {
    const apiRoute = `${BASE_ROUTE}${route}`;
    const router = API_ROUTE_MAP[route];
    app.use(apiRoute, router);
  });
}

export default addApiRoutes;
