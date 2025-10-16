import { afterAll, beforeAll, afterEach, vi } from "vitest";
import { BASE_CONFIGURATION } from "../src/constants/base-configuration";
import { setupCommonMocks } from "./setup-common-mocks";

process.env["MODE"] = "dev";
process.env.TZ = "UTC";
beforeAll(async () => {
  //don't add any configuration here, add to global-setup.ts instead.

  vi.mock("../src/init/configuration", () => ({
    getLiveConfiguration: () => BASE_CONFIGURATION,
    getCachedConfiguration: () => BASE_CONFIGURATION,
    patchConfiguration: vi.fn(),
  }));

  vi.mock("../src/init/db", () => ({
    __esModule: true,
    getDb: () => undefined,
    collection: () => undefined,
    close: () => {
      //
    },
  }));

  setupCommonMocks();
});

afterEach(async () => {
  //nothing
});

afterAll(async () => {
  vi.resetAllMocks();
});
