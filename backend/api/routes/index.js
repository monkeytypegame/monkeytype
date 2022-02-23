import users from "./users";
import configs from "./configs";
import results from "./results";
import presets from "./presets";
import psas from "./psas";
import leaderboards from "./leaderboards";
import quotes from "./quotes";
import { asyncHandler } from "../../middlewares/api-utils";
import { MonkeyResponse } from "../../handlers/monkey-response";

const pathOverride = process.env.API_PATH_OVERRIDE;
const BASE_ROUTE = pathOverride ? `/${pathOverride}` : "";
const APP_START_TIME = Date.now();
let requestsProcessed = 0;

const API_ROUTE_MAP = {
  "/users": users,
  "/configs": configs,
  "/results": results,
  "/presets": presets,
  "/psas": psas,
  "/leaderboards": leaderboards,
  "/quotes": quotes,
};

function addApiRoutes(app) {
  app.use((req, res, next) => {
    const inMaintenance =
      process.env.MAINTENANCE === "true" || req.ctx.configuration.maintenance;

    if (inMaintenance) {
      return res
        .status(503)
        .json({ message: "Server is down for maintenance" });
    }

    requestsProcessed++;
    return next();
  });

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
