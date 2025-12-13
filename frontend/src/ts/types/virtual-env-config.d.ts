export type EnvConfig = {
  backendUrl: string;
  isDevelopment: boolean;
  clientVersion: string;
  recaptchaSiteKey: string;
  quickLoginEmail: string | undefined;
  quickLoginPassword: string | undefined;
  tribeEnabled: boolean;
};

declare module "virtual:env-config" {
  export const envConfig: EnvConfig;
}
