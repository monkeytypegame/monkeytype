type Config = {
  backendUrl: string;
  isDevelopment: boolean;
};

// @ts-expect-error
const backendUrl = BACKEND_URL;
// @ts-expect-error
const isDevelopment = IS_DEVELOPMENT;

export const envConfig: Config = {
  backendUrl,
  isDevelopment,
};
