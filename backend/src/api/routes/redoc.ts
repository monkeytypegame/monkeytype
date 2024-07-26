import { Application } from "express";

export function addRedocMiddlewares(app: Application): void {
  const root = __dirname + "../../../static";
  app.use("/docs/v2/internal", (req, res) => {
    res.sendFile("api/internal.html", { root });
  });
  app.use("/docs/v2/internal.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.sendFile("api/openapi.json", { root });
  });
  app.use("/docs/v2/public", (req, res) => {
    res.sendFile("api/public.html", { root });
  });
  app.use("/docs/v2/public.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.sendFile("api/public.json", { root });
  });
}
