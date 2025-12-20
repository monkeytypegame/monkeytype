import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { languageHashes } from "./vite-plugins/language-hashes";
import { envConfig } from "./vite-plugins/env-config";

const plugins = [
  languageHashes({ skip: true }),
  envConfig({ isDevelopment: true, clientVersion: "TESTING", env: {} }),
];

export const projects: UserWorkspaceConfig[] = [
  {
    test: {
      name: { label: "unit", color: "blue" },
      include: ["__tests__/**/*.spec.ts"],
      exclude: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: ["__tests__/setup-tests.ts"],
    },
    plugins,
  },
  {
    test: {
      name: { label: "jsdom", color: "yellow" },
      include: ["__tests__/**/*.jsdom-spec.ts"],
      exclude: ["__tests__/**/*.spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: ["__tests__/setup-jsdom.ts"],
    },
    plugins,
  },
];
export default defineConfig({
  test: {
    projects: projects,
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
