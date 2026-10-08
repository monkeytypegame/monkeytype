import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { languageHashes } from "./vite-plugins/language-hashes";
import { envConfig } from "./vite-plugins/env-config";
import solidPlugin from "vite-plugin-solid";

const plugins = [
  languageHashes({ skip: true }),
  envConfig({ isDevelopment: true, clientVersion: "TESTING", env: {} }),
  solidPlugin({ hot: false }),
];

const tanstackSolidNoExternal: (string | RegExp)[] = [
  "@solidjs/meta",
  /@tanstack\/solid-.*/,
];

const resolve = {
  alias: [
    // it has no `exports` map, so node loads its cjs build, which requires the
    // cjs zod - its instanceof checks then fail against the esm zod our schemas
    // use, and every value gets json+base64 encoded. vite (the app) uses `module`
    {
      find: /^zod-urlsearchparams$/,
      replacement: "zod-urlsearchparams/dist/index.mjs",
    },
  ],
};

export const projects: UserWorkspaceConfig[] = [
  {
    resolve,
    ssr: {
      noExternal: tanstackSolidNoExternal,
    },
    test: {
      name: { label: "unit", color: "blue" },
      include: ["__tests__/**/*.spec.ts"],
      exclude: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "happy-dom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
        "__tests__/__harness__/mock-dom.ts",
        "__tests__/__harness__/mock-firebase.ts",
        "__tests__/__harness__/mock-env-config.ts",
        "__tests__/__harness__/mock-static.ts",
      ],
    },
    plugins,
  },
  {
    resolve,
    ssr: {
      noExternal: tanstackSolidNoExternal,
    },
    test: {
      name: { label: "jsdom", color: "yellow" },
      include: ["__tests__/**/*.jsdom-spec.ts"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
    },
    plugins,
  },
  {
    resolve,
    ssr: {
      noExternal: tanstackSolidNoExternal,
    },
    test: {
      name: { label: "jsx", color: "green" },
      include: ["__tests__/**/*.spec.tsx"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
      setupFiles: [
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
