import { EnvConfig } from "./constants/env-config";

declare module "virtual:env-config" {
  export const envConfig: EnvConfig;
}
