import "dotenv/config";
import { Counter } from "prom-client";

const auth = new Counter({
  name: "api_request_auth_total",
  help: "Counts authentication events",
  labelNames: ["type"],
});

export function incrementAuth(type: "Bearer" | "ApeKey" | "None"): void {
  auth.inc({ type });
}
