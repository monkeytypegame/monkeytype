import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    globalSetup: "__tests__/global-setup.ts",
    setupFiles: ["__tests__/setup-tests.ts"],

    coverage: {
      include: ["**/*.ts"],
    },
  },
});
