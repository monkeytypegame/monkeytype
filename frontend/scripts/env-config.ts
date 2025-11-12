import { Plugin } from "vite";
import { EnvConfig } from "virtual:env-config";

const virtualModuleId = "virtual:env-config";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

const developmentConfig: EnvConfig = {
  isDevelopment: true,
  backendUrl: fallbackEnv("BACKEND_URL", "http://localhost:5005"),
  clientVersion: "DEVELOPMENT_CLIENT",
  recaptchaSiteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
  quickLoginEmail: process.env["QUICK_LOGIN_EMAIL"],
  quickLoginPassword: process.env["QUICK_LOGIN_PASSWORD"],
};
const productionConfig: Omit<EnvConfig, "clientVersion"> = {
  isDevelopment: false,
  backendUrl: fallbackEnv("BACKEND_URL", "https://api.monkeytype.com"),
  recaptchaSiteKey: process.env["RECAPTCHA_SITE_KEY"] ?? "",
  quickLoginEmail: undefined,
  quickLoginPassword: undefined,
};

export function envConfig(
  options:
    | {
        isDevelopment: true;
      }
    | {
        isDevelopment: false;
        clientVersion: string;
      }
): Plugin {
  return {
    name: "virtual-env-config",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const envConfig = options.isDevelopment
          ? developmentConfig
          : {
              ...productionConfig,
              clientVersion: options.clientVersion,
            };

        return `
          export const envConfig = ${JSON.stringify(envConfig)};
        `;
      }
      return;
    },
  };
}

function fallbackEnv(envVariable: string, fallback: string): string {
  const value = process.env[envVariable];
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}
