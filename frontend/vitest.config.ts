import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { languageHashes } from "./vite-plugins/language-hashes";
import { envConfig } from "./vite-plugins/env-config";
import solidPlugin from "vite-plugin-solid";

const plugins = [
  languageHashes({ skip: true }),
  envConfig({ isDevelopment: true, clientVersion: "TESTING", env: {} }),
  solidPlugin(),
];

export const projects: UserWorkspaceConfig[] = [
  {
    test: {
      name: { label: "unit", color: "blue" },
      include: ["__tests__/**/*.spec.ts"],
      exclude: ["__tests__/**/*.jsdom-spec.{ts,tsx}"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: ["__tests__/setup-tests.ts"],
    },
    plugins,
  },
  {
    test: {
      name: { label: "jsdom", color: "yellow" },
      include: ["__tests__/**/*.jsdom-spec.{ts,tsx}"],
      exclude: ["__tests__/**/*.spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: ["__tests__/setup-jsdom.ts"],
      globals: true,
    },
    plugins,
  },
];
export default defineConfig({
  plugins,
  test: {
    projects: projects,
    coverage: {
      include: ["**/*.{ts,tsx}"],
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
