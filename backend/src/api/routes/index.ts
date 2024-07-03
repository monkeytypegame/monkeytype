import _ from "lodash";
import { contract } from "shared/contract/index.contract";
import psas from "./psas";
import publicStats from "./public";
import users from "./users";
import { join } from "path";
import quotes from "./quotes";
import results from "./results";
import presets from "./presets";
import apeKeys from "./ape-keys";
import admin from "./admin";
import webhooks from "./webhooks";
import dev from "./dev";
import configuration from "./configuration";
import { version } from "../../version";
import leaderboards from "./leaderboards";
import addSwaggerMiddlewares from "./swagger";
import { asyncHandler } from "../../middlewares/api-utils";
import { MonkeyResponse, MonkeyResponse2 } from "../../utils/monkey-response";
import { recordClientVersion } from "../../utils/prometheus";
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
import {
  TsRestRequest,
  createExpressEndpoints,
  initServer,
} from "@ts-rest/express";
import { configsRoutes } from "./configs";
import { ZodIssue } from "zod";
import { MonkeyValidationError } from "shared/contract/shared/types";
import { AppRoute, AppRouter } from "@ts-rest/core";
import { addRedocMiddlewares } from "./redoc";
import { authenticateTsRestRequest } from "../../middlewares/auth";

const pathOverride = process.env["API_PATH_OVERRIDE"];
const BASE_ROUTE = pathOverride !== undefined ? `/${pathOverride}` : "";
const APP_START_TIME = Date.now();

const API_ROUTE_MAP = {
  "/users": users,
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

const s = initServer();
const router = s.router(contract, {
  configs: configsRoutes,
});

export function addApiRoutes(app: Application): void {
  applyApiRoutes(app);
  applyTsRestApiRoutes(app);

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

function applyTsRestApiRoutes(app: IRouter): void {
  createExpressEndpoints(contract, router, app, {
    jsonQuery: true,
    requestValidationErrorHandler(err, req, res, next) {
      if (err.body?.issues === undefined) return next();
      const issues = err.body?.issues;
      res.status(400).json({
        message:
          issues.length === 1
            ? prettyErrorMessage(issues[0])
            : "multiple validation errors",
        validationErrors: issues.map(prettyErrorMessage),
      } as MonkeyValidationError);
    },
    globalMiddleware: [authenticateTsRestRequest()],
  });
}

function prettyErrorMessage(issue: ZodIssue | undefined): string {
  if (issue === undefined) return "";
  return `"${issue.path.join(".")}" ${issue.message}`;
}

function applyApiRoutes(app: Application): void {
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
  addRedocMiddlewares(app);

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
}

export function callController<
  TRoute extends AppRoute | AppRouter,
  TQuery,
  TBody,
  TParams,
  TResponse,
  TStatus = 200
>(
  handler: Handler<TQuery, TBody, TParams, TResponse>
): (all: RequestType2<TRoute, TQuery, TBody, TParams>) => Promise<{
  status: TStatus;
  body: { message: string; data: TResponse };
}> {
  return async (all) => {
    const req: MonkeyTypes.Request2<TQuery, TBody, TParams> = {
      body: all.body as TBody,
      query: all.query as TQuery,
      params: all.params as TParams,
      raw: all.req,
      ctx: all.req["ctx"],
    };

    const result = await handler(req);
    const response = {
      status: 200 as TStatus,
      body: {
        message: result.message,
        data: result.data as TResponse,
      },
    };

    return response;
  };
}

type WithBody<T> = {
  body: T;
};
type WithQuery<T> = {
  query: T;
};

type WithParams<T> = {
  params: T;
};

type WithoutBody = {
  body?: never;
};
type WithoutQuery = {
  query?: never;
};
type WithoutParams = {
  params?: never;
};

type Handler<TQuery, TBody, TParams, TResponse> = (
  req: MonkeyTypes.Request2<TQuery, TBody, TParams>
) => Promise<MonkeyResponse2<TResponse>>;

type RequestType2<
  TRoute extends AppRoute | AppRouter,
  TQuery,
  TBody,
  TParams
> = {
  req: TsRestRequest<TRoute>;
} & (TQuery extends undefined ? WithoutQuery : WithQuery<TQuery>) &
  (TBody extends undefined ? WithoutBody : WithBody<TBody>) &
  (TParams extends undefined ? WithoutParams : WithParams<TParams>);
