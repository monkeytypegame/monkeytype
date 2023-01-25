import cors from "cors";
import helmet from "helmet";
import addApiRoutes from "./api/routes";
import express, { urlencoded, json } from "express";
import contextMiddleware from "./middlewares/context";
import errorHandlingMiddleware from "./middlewares/error";
import {
  badAuthRateLimiterHandler,
  rootRateLimiter,
} from "./middlewares/rate-limit";
import { getPrescenceMiddleware } from "./services/prescence";

function buildApp(): express.Application {
  const app = express();

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(cors());
  app.use(helmet());

  app.set("trust proxy", 1);

  app.use(contextMiddleware);

  app.use(badAuthRateLimiterHandler);
  app.use(rootRateLimiter);

  app.use(getPrescenceMiddleware());

  addApiRoutes(app);

  app.use(errorHandlingMiddleware);

  return app;
}

export default buildApp();
