import { envConfig } from "virtual:env-config";
import { get } from "../ape/server-configuration";

export function getTribeMode(): "disabled" | "enabled" | "enabled_stealth" {
  if (envConfig.forceTribe) return "enabled";
  return get()?.tribe?.mode ?? "disabled";
}
