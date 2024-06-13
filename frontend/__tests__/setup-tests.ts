import $ from "jquery";
// @ts-ignore
global["$"] = $;
// @ts-ignore
global["jQuery"] = $;

vi.mock("../src/ts/constants/env-config", () => ({
  envConfig: {
    backendUrl: "invalid",
    isDevelopment: true,
  },
}));

vi.mock("../src/ts/firebase", () => ({
  app: undefined,
  Auth: undefined,
  isAuthenticated: () => false,
}));
