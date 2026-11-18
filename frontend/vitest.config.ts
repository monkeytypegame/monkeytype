import { lstatSync, realpathSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { workspacePackagesAlias } from "./vite-plugins/workspace-packages";
import { languageHashes } from "./vite-plugins/language-hashes";
import { envConfig } from "./vite-plugins/env-config";
import solidPlugin from "vite-plugin-solid";

const plugins = [
  languageHashes({ skip: true }),
  envConfig({ isDevelopment: true, clientVersion: "TESTING", env: {} }),
  solidPlugin({ hot: false }),
];

const resolve = { alias: workspacePackagesAlias };

// worktrees set up by scripts/setup-worktree.sh link node_modules from the main
// checkout: allow reading the linked deps, and keep vite's cache in the
// worktree (agents' sandboxes can only write there)
const nodeModules = fileURLToPath(new URL("./node_modules", import.meta.url));
const linkedCheckout = lstatSync(nodeModules, {
  throwIfNoEntry: false,
})?.isSymbolicLink()
  ? dirname(dirname(realpathSync(nodeModules)))
  : undefined;
const worktree =
  linkedCheckout === undefined
    ? {}
    : {
        cacheDir: ".vite-worktree",
        server: {
          fs: {
            allow: [
              fileURLToPath(new URL("..", import.meta.url)),
              linkedCheckout,
            ],
          },
        },
      };

const tanstackSolidNoExternal: (string | RegExp)[] = [
  "@solidjs/meta",
  /@tanstack\/solid-.*/,
];

export const projects: UserWorkspaceConfig[] = [
  {
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
    resolve,
    ...worktree,
  },
  {
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
    resolve,
    ...worktree,
  },
  {
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
        "__tests__/__harness__/mock-firebase.ts",
      ],
      globals: true,
    },
    plugins,
    resolve,
    ...worktree,
  },
  {
    ssr: {
      noExternal: tanstackSolidNoExternal,
    },
    test: {
      name: { label: "test-page", color: "magenta" },
      // specs on the test-page harness (__tests__/__harness__/test-page.tsx)
      include: ["__tests__/**/*.page-spec.tsx"],
      environment: "jsdom",
      globalSetup: "__tests__/global-setup.ts",
      // no mock-dom: the test page's modules query the real DOM
      setupFiles: ["__tests__/__harness__/setup-jsx.ts"],
      globals: true,
    },
    plugins,
    resolve,
    ...worktree,
  },
];
export default defineConfig({
  test: {
    projects: projects,
    coverage: {
      include: ["**/*.ts", "**/*.tsx"],
    },
  },
  plugins,
});
