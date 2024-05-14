import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["__tests__/setup-tests.ts"],
    pool: "forks",

    coverage: {
      include: ["**/*.ts"],
    },
  },
});
