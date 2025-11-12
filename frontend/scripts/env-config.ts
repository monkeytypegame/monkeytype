import { Plugin } from "vite";
import { EnvConfig } from "virtual:env-config";

const virtualModuleId = "virtual:env-config";
const resolvedVirtualModuleId = "\0" + virtualModuleId;
let isDevelopment = process.env["NODE_ENV"] === "development";
let clientVersion = "unknown";

const developmentConfig: EnvConfig = {
  isDevelopment,
  backendUrl: fallbackEnv("BACKEND_URL", "http://localhost:5005"),
  clientVersion: "DEVELOPMENT_CLIENT",
  recaptchaSiteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
  quickLoginEmail: process.env["QUICK_LOGIN_EMAIL"],
  quickLoginPassword: process.env["QUICK_LOGIN_PASSWORD"],
};
const productionConfig: EnvConfig = {
  isDevelopment,
  backendUrl: fallbackEnv("BACKEND_URL", "https://api.monkeytype.com"),
  clientVersion,
  recaptchaSiteKey: process.env["RECAPTCHA_SITE_KEY"] ?? "",
  quickLoginEmail: undefined,
  quickLoginPassword: undefined,
};

export function envConfig(): Plugin {
  return {
    name: "virtual-env-config",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const envConfig = isDevelopment ? developmentConfig : productionConfig;

        return `
          export const envConfig = ${JSON.stringify(envConfig)};
        `;
      }
      return;
    },
    configResolved(resolvedConfig) {
      clientVersion =
        (resolvedConfig?.define?.["CLIENT_VERSION"] as string) || "unknown";
    },
  };
}

function fallbackEnv(envVariable: string, fallback: string): string {
  const value = process.env[envVariable];
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}
