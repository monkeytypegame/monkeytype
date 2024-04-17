import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["__tests__/setup-tests.ts"],
    pool: "forks",

    coverage: {
      include: ["**/*.ts"],
      provider: "istanbul",
      reporter: [
        "text", // For the terminal
        "lcov", // For the VSCode extension and browser
      ],
    },
  },
});
