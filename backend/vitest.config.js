import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: "__tests__/global-setup.ts",
    setupFiles: ["__tests__/setup-tests.ts"],
    pool: "forks", //this should be the default value, however the CI fails without this set.

    coverage: {
      include: ["**/*.ts"],
    },
  },
});
