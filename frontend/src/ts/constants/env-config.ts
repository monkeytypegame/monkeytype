interface Config {
  backendUrl: string;
  isDevelopment: boolean;
}

// @ts-ignore
const backendUrl = BACKEND_URL;
// @ts-ignore
const isDevelopment = IS_DEVELOPMENT;

export const envConfig: Config = {
  backendUrl,
  isDevelopment,
};
