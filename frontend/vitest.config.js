import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["__tests__/setup-tests.ts"],

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
