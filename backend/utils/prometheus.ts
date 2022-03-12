import "dotenv/config";
import { Counter, register } from "prom-client";
import { Application } from "express";
import basicAuth from "express-basic-auth";

const METRICS_PASSWORD =
  process.env.MODE === "dev" ? "stats" : process.env.METRICS_PASSWORD;

const auth = new Counter({
  name: "auth_counter",
  help: "Counts authentication events",
  labelNames: ["type"],
});

export function incrementAuth(type: "Bearer" | "ApeKey" | "None"): void {
  auth.inc({ type });
}

export function addRoute(app: Application): void {
  if (!METRICS_PASSWORD) return;
  app.get(
    "/metrics",
    basicAuth({
      users: { stats: METRICS_PASSWORD },
    }),
    async (_req, res) => {
      res.send(await register.metrics());
    }
  );
}
