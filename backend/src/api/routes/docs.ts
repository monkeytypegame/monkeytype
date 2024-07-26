import { Router } from "express";
import * as swaggerUi from "swagger-ui-express";
import publicSwaggerSpec from "../../documentation/public-swagger.json";

const SWAGGER_UI_OPTIONS = {
  customCss: ".swagger-ui .topbar { display: none } .try-out { display: none }",
  customSiteTitle: "Monkeytype API Documentation",
};

const router = Router();

const root = __dirname + "../../../static";

router.use("/v2/internal", (req, res) => {
  res.sendFile("api/internal.html", { root });
});

router.use("/v2/internal.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile("api/openapi.json", { root });
});

router.use("/v2/public", (req, res) => {
  res.sendFile("api/public.html", { root });
});

router.use("/v2/public.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile("api/public.json", { root });
});

const options = {};

router.use(
  "/",
  swaggerUi.serveFiles(publicSwaggerSpec, options),
  swaggerUi.setup(publicSwaggerSpec, SWAGGER_UI_OPTIONS)
);

export default router;
