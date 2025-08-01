import { defineConfig } from "vitest/config";

const isIntegrationTest = process.env["INTEGRATION_TESTS"] === "true";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: "__tests__/global-setup.ts",
    setupFiles: isIntegrationTest
      ? ["__tests__/__integration__/setup-integration-tests.ts"]
      : ["__tests__/setup-tests.ts"],
    //pool: "forks", //this should be the default value, however the CI fails without this set.
    // run integration tests single threaded bevcause they share the same mongodb
    pool: isIntegrationTest ? "threads" : "forks",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      include: ["**/*.ts"],
    },
  },
});
