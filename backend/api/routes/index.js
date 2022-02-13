const { asyncHandler } = require("../../middlewares/api-utils");
const { MonkeyResponse } = require("../../handlers/monkey-response");

const pathOverride = process.env.API_PATH_OVERRIDE;
const BASE_ROUTE = pathOverride ? `/${pathOverride}` : "";
const APP_START_TIME = Date.now();
let requestsProcessed = 0;

const API_ROUTE_MAP = {
  "/users": require("./users"),
  "/configs": require("./configs"),
  "/results": require("./results"),
  "/presets": require("./presets"),
  "/psas": require("./psas"),
  "/leaderboards": require("./leaderboards"),
  "/quotes": require("./quotes"),
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
    asyncHandler((_req, _res) => {
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

module.exports = addApiRoutes;
