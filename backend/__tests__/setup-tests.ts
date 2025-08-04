import { afterAll, beforeAll, afterEach } from "vitest";
import { BASE_CONFIGURATION } from "../src/constants/base-configuration";
import { setupCommonMocks } from "./setup-common-mocks";

process.env["MODE"] = "dev";

beforeAll(async () => {
  //don't add any configuration here, add to global-setup.ts instead.

  vi.mock("../src/dal/logs", () => ({
    addLog: vi.fn(),
    addImportantLog: vi.fn(),
    deleteUserLogs: vi.fn(),
  }));
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
