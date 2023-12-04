import cors from "cors";
import helmet from "helmet";
import addApiRoutes from "./api/routes";
import express, { urlencoded, json, raw } from "express";
import contextMiddleware from "./middlewares/context";
import errorHandlingMiddleware from "./middlewares/error";
import {
  badAuthRateLimiterHandler,
  rootRateLimiter,
} from "./middlewares/rate-limit";

function buildApp(): express.Application {
  const app = express();
  const jsonParser = json();
  const rawParser = raw({ type: "application/json" });

  app.use((req, res, next) => {
    if (req.path === "/store/webhook") {
      return rawParser(req, res, next);
    }
    return jsonParser(req, res, next);
  });

  app.use(urlencoded({ extended: true }));
  app.use(cors());
  app.use(helmet());

  app.set("trust proxy", 1);

  app.use(contextMiddleware);

  app.use(badAuthRateLimiterHandler);
  app.use(rootRateLimiter);

  addApiRoutes(app);

  app.use(errorHandlingMiddleware);

  return app;
}

export default buildApp();
