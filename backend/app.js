import express, { urlencoded, json } from "express";
import cors from "cors";
import addApiRoutes from "./api/routes";
import contextMiddleware from "./middlewares/context";
import errorHandlingMiddleware from "./middlewares/error";

function buildApp() {
  const app = express();

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(cors());

  app.set("trust proxy", 1);

  app.use(contextMiddleware);

  addApiRoutes(app);

  app.use(errorHandlingMiddleware);

  return app;
}

export default buildApp();
