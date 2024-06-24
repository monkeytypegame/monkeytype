import { Application } from "express";
export function addRedocMiddlewares(app: Application): void {
  app.use("/v2/docs-internal", (req, res) => {
    res.sendFile("api/internal.html", {
      root: __dirname + "../../../../build/static",
    });
  });
  app.use("/v2/docs-internal.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.sendFile("api/openapi.json", {
      root: __dirname + "../../../../build/static",
    });
  });
  app.use("/v2/docs", (req, res) => {
    res.sendFile("api/public.html", {
      root: __dirname + "../../../../build/static",
    });
  });
  app.use("/v2/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.sendFile("api/public.json", {
      root: __dirname + "../../../../build/static",
    });
  });
}
