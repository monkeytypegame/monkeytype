import { envConfig } from "virtual:env-config";

export function isDevEnvironment(): boolean {
  return envConfig.isDevelopment;
}
