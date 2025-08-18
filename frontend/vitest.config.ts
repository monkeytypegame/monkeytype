import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: { label: "assets", color: "yellow" },
          setupFiles: ["__tests__/setup-tests.ts"],
          globalSetup: "__tests__/global-setup.ts",
          include: ["__tests__/constants/**/*.spec.ts"],
        },
      },
      {
        test: {
          name: { label: "unit", color: "blue" },
          environment: "happy-dom",
          setupFiles: ["__tests__/setup-tests.ts"],
          globalSetup: "__tests__/global-setup.ts",
          include: ["__tests__/**/*.spec.ts"],
          exclude: ["__tests__/constants/**/*.spec.ts"],
        },
      },
    ],

    coverage: {
      include: ["**/*.ts"],
    },
    deps: {
      optimizer: {
        web: {
          include: ["@monkeytype/funbox"],
        },
      },
    },
  },
});
