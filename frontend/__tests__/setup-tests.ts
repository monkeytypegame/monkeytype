import { jest } from "@jest/globals";

import $ from "jquery";
// @ts-ignore
global["$"] = $;
// @ts-ignore
global["jQuery"] = $;

jest.mock("../src/ts/constants/env-config", () => ({
  envConfig: {
    backendUrl: "invalid",
    isDevelopment: true,
  },
}));

jest.mock("../src/ts/firebase", () => ({
  app: undefined,
  Auth: undefined,
}));
