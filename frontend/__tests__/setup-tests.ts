import $ from "jquery";
//@ts-expect-error add to globl
global["$"] = $;
//@ts-expect-error add to globl
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
