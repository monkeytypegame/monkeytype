import { Application } from "express";
export function addRedocMiddlewares(app: Application): void {
  app.use("/v2/docs", (req, res) => {
    res.sendFile("api/documentation-all.html", {
      root: __dirname + "../../../../build/static",
    });
  });
  app.use("/v2/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.sendFile("api/openapi.json", {
      root: __dirname + "../../../../build/static",
    });
  });
}
