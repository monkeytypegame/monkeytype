/* eslint-disable @typescript-eslint/no-unsafe-assignment */
type Config = {
  backendUrl: string;
  isDevelopment: boolean;
  clientVersion: string;
  recaptchaSiteKey: string;
  quickLoginEmail: string | undefined;
  quickLoginPassword: string | undefined;
};

//@ts-expect-error these get replaced by vite
const backendUrl = BACKEND_URL;
// @ts-expect-error
const isDevelopment = IS_DEVELOPMENT;
// @ts-expect-error
const clientVersion = CLIENT_VERSION;
// @ts-expect-error
const recaptchaSiteKey = RECAPTCHA_SITE_KEY;
// @ts-expect-error
const quickLoginEmail = QUICK_LOGIN_EMAIL;
// @ts-expect-error
const quickLoginPassword = QUICK_LOGIN_PASSWORD;

export const envConfig: Config = {
  backendUrl,
  isDevelopment,
  clientVersion,
  recaptchaSiteKey,
  quickLoginEmail,
  quickLoginPassword,
};
