/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export type EnvConfig = {
  backendUrl: string;
  isDevelopment: boolean;
  clientVersion: string;
  recaptchaSiteKey: string;
  quickLoginEmail: string | undefined;
  quickLoginPassword: string | undefined;
};
