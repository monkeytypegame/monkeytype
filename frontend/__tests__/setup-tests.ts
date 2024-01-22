jest.mock("../src/ts/constants/env-config", () => ({
  backendUrl: "invalid",
  isDevelopment: true,
}));
