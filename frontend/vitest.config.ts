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
      exclude: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
        "__tests__/__harness__/setup-jquery.ts",
        "__tests__/__harness__/mock-dom.ts",
        "__tests__/__harness__/mock-firebase.ts",
        "__tests__/__harness__/mock-env-config.ts",
      ],
    },
    plugins,
  },
  {
    test: {
      name: { label: "jsdom", color: "yellow" },
      include: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: ["__tests__/__harness__/setup-jquery.ts"],
    },
    plugins,
  },
  {
    ssr: {
      noExternal: ["@solidjs/meta"],
    },
    test: {
      name: { label: "jsx", color: "green" },
      include: ["__tests__/**/*.spec.tsx"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
        "__tests__/__harness__/setup-jquery.ts",
        "__tests__/__harness__/setup-jsx.ts",
        "__tests__/__harness__/mock-dom.ts",
      ],
      globals: true,
    },
    plugins,
  },
];
export default defineConfig({
  test: {
    projects: projects,
    coverage: {
      include: ["**/*.ts", "**/*.tsx"],
    },
    deps: {
      optimizer: {
        web: {
          include: ["@monkeytype/funbox"],
        },
      },
    },
  },
  plugins,
});
