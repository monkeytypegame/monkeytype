type Config = {
  backendUrl: string;
  isDevelopment: boolean;
  clientVersion: string;
  recaptchaSiteKey: string;
};

//@ts-expect-error these get replaced by vite
const backendUrl = BACKEND_URL;
// @ts-expect-error
const isDevelopment = IS_DEVELOPMENT;
// @ts-expect-error
const clientVersion = CLIENT_VERSION;
// @ts-expect-error
const recaptchaSiteKey = RECAPTCHA_SITE_KEY;

export const envConfig: Config = {
  backendUrl,
  isDevelopment,
  clientVersion,
  recaptchaSiteKey,
};
