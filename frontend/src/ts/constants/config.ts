interface Config {
  backendUrl: string;
  isDevelopment: boolean;
}

export const config: Config = {
  // @ts-ignore
  backendUrl: BACKEND_URL,
  // @ts-ignore
  isDevelopment: IS_DEVELOPMENT,
};
