import { Language } from "@monkeytype/schemas/languages";
import { EnvConfig } from "./constants/env-config";

declare module "virtual:language-hashes" {
  export const languageHashes: Record<Language, string>;
}

declare module "virtual:env-config" {
  export const envConfig: EnvConfig;
}
