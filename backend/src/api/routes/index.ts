import _ from "lodash";
import { contract } from "@monkeytype/contracts/index";
import psas from "./psas";
import publicStats from "./public";
import users from "./users";
import { join } from "path";
import quotes from "./quotes";
import results from "./results";
import presets from "./presets";
import apeKeys from "./ape-keys";
import admin from "./admin";
import docs from "./docs";
import webhooks from "./webhooks";
import dev from "./dev";
import configs from "./configs";
import configuration from "./configuration";
import { version } from "../../version";
import leaderboards from "./leaderboards";
import addSwaggerMiddlewares from "./swagger";
import { MonkeyResponse } from "../../utils/monkey-response";
import {
  Application,
  IRouter,
  NextFunction,
  Response,
  Router,
  static as expressStatic,
} from "express";
import { isDevEnvironment } from "../../utils/misc";
import { getLiveConfiguration } from "../../init/configuration";
import Logger from "../../utils/logger";
import { createExpressEndpoints, initServer } from "@ts-rest/express";
import { ZodIssue } from "zod";
import { MonkeyValidationError } from "@monkeytype/contracts/schemas/api";
import { authenticateTsRestRequest } from "../../middlewares/auth";
import { rateLimitRequest } from "../../middlewares/rate-limit";
import { verifyPermissions } from "../../middlewares/permission";
import { verifyRequiredConfiguration } from "../../middlewares/configuration";
import { ExpressRequestWithContext } from "../types";

const pathOverride = process.env["API_PATH_OVERRIDE"];
const BASE_ROUTE = pathOverride !== undefined ? `/${pathOverride}` : "";
const APP_START_TIME = Date.now();

const API_ROUTE_MAP = {
  "/docs": docs,
};

const s = initServer();
const router = s.router(contract, {
  admin,
  apeKeys,
  configs,
  presets,
  psas,
  public: publicStats,
  leaderboards,
  results,
  configuration,
  dev,
  users,
  quotes,
  webhooks,
});

export function addApiRoutes(app: Application): void {
  applyDevApiRoutes(app);
  applyApiRoutes(app);
  applyTsRestApiRoutes(app);

  app.use((req, res) => {
    res
      .status(404)
      .json(
        new MonkeyResponse(
          `Unknown request URL (${req.method}: ${req.path})`,
          null
        )
      );
  });
}

function applyTsRestApiRoutes(app: IRouter): void {
  createExpressEndpoints(contract, router, app, {
    jsonQuery: true,
    requestValidationErrorHandler(err, req, res, _next) {
      let message: string | undefined = undefined;
      let validationErrors: string[] | undefined = undefined;

      if (err.pathParams?.issues !== undefined) {
        message = "Invalid path parameter schema";
        validationErrors = err.pathParams.issues.map(prettyErrorMessage);
      } else if (err.query?.issues !== undefined) {
        message = "Invalid query schema";
        validationErrors = err.query.issues.map(prettyErrorMessage);
      } else if (err.body?.issues !== undefined) {
        message = "Invalid request data schema";
        validationErrors = err.body.issues.map(prettyErrorMessage);
      } else if (err.headers?.issues !== undefined) {
        message = "Invalid header schema";
        validationErrors = err.headers.issues.map(prettyErrorMessage);
      } else {
        Logger.error(
          `Unknown validation error for ${req.method} ${
            req.path
          }: ${JSON.stringify(err)}`
        );
        res
          .status(500)
          .json({ message: "Unknown validation error. Contact support." });
        return;
      }

      res
        .status(422)
        .json({ message, validationErrors } as MonkeyValidationError);
    },
    globalMiddleware: [
      authenticateTsRestRequest(),
      rateLimitRequest(),
      verifyRequiredConfiguration(),
      verifyPermissions(),
    ],
  });
}

function prettyErrorMessage(issue: ZodIssue | undefined): string {
  if (issue === undefined) return "";
  const path = issue.path.length > 0 ? `"${issue.path.join(".")}" ` : "";
  return `${path}${issue.message}`;
}

function applyDevApiRoutes(app: Application): void {
  if (isDevEnvironment()) {
    //disable csp to allow assets to load from unsecured http
    app.use((req, res, next) => {
      res.setHeader("Content-Security-Policy", "");
      next();
    });
    app.use("/configure", expressStatic(join(__dirname, "../../../private")));

    app.use(async (req, res, next) => {
      const slowdown = (await getLiveConfiguration()).dev.responseSlowdownMs;
      if (slowdown > 0) {
        Logger.info(
          `Simulating ${slowdown}ms delay for ${req.method} ${req.path}`
        );
        await new Promise((resolve) => setTimeout(resolve, slowdown));
      }
      next();
    });
  }
}

function applyApiRoutes(app: Application): void {
  addSwaggerMiddlewares(app);

  app.use(
    (
      req: ExpressRequestWithContext,
      res: Response,
      next: NextFunction
    ): void => {
      if (req.path.startsWith("/configuration")) {
        next();
        return;
      }

      const inMaintenance =
        process.env["MAINTENANCE"] === "true" ||
        req.ctx.configuration.maintenance;

      if (inMaintenance) {
        res.status(503).json({ message: "Server is down for maintenance" });
        return;
      }

      next();
    }
  );

  app.get("/", (_req, res) => {
    res.status(200).json(
      new MonkeyResponse("ok", {
        uptime: Date.now() - APP_START_TIME,
        version,
      })
    );
  });

  _.each(API_ROUTE_MAP, (router: Router, route) => {
    const apiRoute = `${BASE_ROUTE}${route}`;
    app.use(apiRoute, router);
  });
}
