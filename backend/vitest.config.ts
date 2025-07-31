import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: { label: "unit", color: "blue" },
          setupFiles: ["__tests__/setup-tests.ts"],
          include: ["__tests__/**/*.spec.ts"],
          exclude: ["__tests__/__integration__"],
          sequence: {
            groupOrder: 0,
          },
        },
      },
      {
        extends: true,
        test: {
          name: { label: "integration", color: "yellow" },
          setupFiles: ["__tests__/__integration__/setup-integration-tests.ts"],
          globalSetup: "__tests__/__integration__/global-setup.ts",
          include: ["__tests__/__integration__/**/*.spec.ts"],
          exclude: ["**/*.isolated.spec.ts"],

          sequence: {
            concurrent: false,
            groupOrder: 1,
          },
        },
      },
      {
        extends: true,
        test: {
          name: { label: "integration-isolated", color: "magenta" },
          setupFiles: ["__tests__/__integration__/setup-integration-tests.ts"],
          globalSetup: "__tests__/__integration__/global-setup.ts",
          include: ["__tests__/__integration__/**/*.isolated.spec.ts"],

          sequence: {
            concurrent: false,
            groupOrder: 2,
          },
          pool: "threads",
          poolOptions: {
            threads: {
              singleThread: true,
            },
          },
        },
      },
    ],
    globals: true,
    environment: "node",
    pool: "forks",
    // globalSetup: "__tests__/global-setup.ts",
    /*setupFiles: isIntegrationTest
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
    */
    coverage: {
      include: ["**/*.ts"],
    },
  },
});
