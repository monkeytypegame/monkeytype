import { envConfig } from "virtual:env-config";
import { configurationPromise, get } from "../ape/server-configuration";

export function getTribeMode(): "disabled" | "enabled" | "enabled_stealth" {
  if (envConfig.forceTribe) return "enabled";
  return get()?.tribe?.mode ?? "disabled";
}

export async function getAwaitedTribeMode(): Promise<
  "disabled" | "enabled" | "enabled_stealth"
> {
  if (envConfig.forceTribe) return "enabled";
  try {
    await configurationPromise;
    return getTribeMode();
  } catch {
    return "disabled";
  }
}
