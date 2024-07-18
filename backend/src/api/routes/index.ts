import _ from "lodash";
import psas from "./psas.js";
import publicStats from "./public.js";
import users from "./users.js";
import { join } from "path";
import quotes from "./quotes.js";
import configs from "./configs.js";
import results from "./results.js";
import presets from "./presets.js";
import apeKeys from "./ape-keys.js";
import admin from "./admin.js";
import webhooks from "./webhooks.js";
import dev from "./dev.js";
import configuration from "./configuration.js";
import { version } from "../../version.js";
import leaderboards from "./leaderboards.js";
import addSwaggerMiddlewares from "./swagger.js";
import { asyncHandler } from "../../middlewares/utility.js";
import { MonkeyResponse } from "../../utils/monkey-response.js";
import { recordClientVersion } from "../../utils/prometheus.js";
import {
  type Application,
  type NextFunction,
  type Response,
  Router,
  static as expressStatic,
} from "express";
import { isDevEnvironment } from "../../utils/misc.js";
import { getLiveConfiguration } from "../../init/configuration.js";
import Logger from "../../utils/logger.js";

const pathOverride = process.env["API_PATH_OVERRIDE"];
const BASE_ROUTE = pathOverride !== undefined ? `/${pathOverride}` : "";
const APP_START_TIME = Date.now();

const API_ROUTE_MAP = {
  "/users": users,
  "/configs": configs,
  "/results": results,
  "/presets": presets,
  "/psas": psas,
  "/public": publicStats,
  "/leaderboards": leaderboards,
  "/quotes": quotes,
  "/ape-keys": apeKeys,
  "/admin": admin,
  "/webhooks": webhooks,
};

function addApiRoutes(app: Application): void {
  app.get("/leaderboard", (_req, res) => {
    res.sendStatus(404);
  });

  if (isDevEnvironment()) {
    //disable csp to allow assets to load from unsecured http
    app.use((req, res, next) => {
      res.setHeader("Content-Security-Policy", "");
      return next();
    });
    app.use("/configure", expressStatic(join(__dirname, "../../../private")));

    app.use(async (req, res, next) => {
      const slowdown = (await getLiveConfiguration()).dev.responseSlowdownMs;
      if (slowdown > 0) {
        Logger.info(`Simulating ${slowdown}ms delay for ${req.path}`);
        await new Promise((resolve) => setTimeout(resolve, slowdown));
      }
      next();
    });

    //enable dev edpoints
    app.use("/dev", dev);
  }

  // Cannot be added to the route map because it needs to be added before the maintenance handler
  app.use("/configuration", configuration);

  addSwaggerMiddlewares(app);

  app.use(
    (req: MonkeyTypes.Request, res: Response, next: NextFunction): void => {
      const inMaintenance =
        process.env["MAINTENANCE"] === "true" ||
        req.ctx.configuration.maintenance;

      if (inMaintenance) {
        res.status(503).json({ message: "Server is down for maintenance" });
        return;
      }

      if (req.path === "/psas") {
        const clientVersion =
          (req.headers["x-client-version"] as string) ||
          req.headers["client-version"];
        recordClientVersion(clientVersion?.toString() ?? "unknown");
      }

      next();
    }
  );

  app.get(
    "/",
    asyncHandler(async (_req, _res) => {
      return new MonkeyResponse("ok", {
        uptime: Date.now() - APP_START_TIME,
        version,
      });
    })
  );

  app.get("/psa", (_req, res) => {
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
