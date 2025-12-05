import { Plugin } from "vite";
import { EnvConfig } from "virtual:env-config";

const virtualModuleId = "virtual:env-config";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export function envConfig(options: {
  isDevelopment: boolean;
  clientVersion: string;
  env: Record<string, string>;
}): Plugin {
  return {
    name: "virtual-env-config",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const envConfig: EnvConfig = options.isDevelopment
          ? {
              isDevelopment: true,
              backendUrl: fallback(
                options.env["BACKEND_URL"],
                "http://localhost:5005",
              ),
              clientVersion: "DEVELOPMENT_CLIENT",
              recaptchaSiteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
              quickLoginEmail: options.env["QUICK_LOGIN_EMAIL"],
              quickLoginPassword: options.env["QUICK_LOGIN_PASSWORD"],
            }
          : {
              isDevelopment: false,
              backendUrl: fallback(
                options.env["BACKEND_URL"],
                "https://api.monkeytype.com",
              ),
              recaptchaSiteKey: options.env["RECAPTCHA_SITE_KEY"] ?? "",
              quickLoginEmail: undefined,
              quickLoginPassword: undefined,
              clientVersion: options.clientVersion,
            };

        //TODO remove after testing
        console.log("### using config", JSON.stringify(envConfig));
        return `
          export const envConfig = ${JSON.stringify(envConfig)};
        `;
      }
      return;
    },
  };
}

function fallback(value: string | undefined | null, fallback: string): string {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}
