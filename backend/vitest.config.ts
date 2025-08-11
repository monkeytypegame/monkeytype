import { defineConfig, UserWorkspaceConfig } from "vitest/config";

export const projects: UserWorkspaceConfig[] = [
  {
    test: {
      name: { label: "unit", color: "blue" },
      globals: true,
      setupFiles: ["__tests__/setup-tests.ts"],
      include: ["__tests__/**/*.spec.ts"],
      exclude: ["__tests__/__integration__"],
      sequence: {
        groupOrder: 0,
      },
    },
  },
  {
    test: {
      name: { label: "integration", color: "yellow" },
      globals: true,
      setupFiles: ["__tests__/__integration__/setup-integration-tests.ts"],
      globalSetup: "__tests__/__integration__/global-setup.ts",
      include: ["__tests__/__integration__/**/*.spec.ts"],
      exclude: ["**/*.isolated.spec.ts"],

      sequence: {
        concurrent: false,
        groupOrder: 1,
      },
    },
  },
  {
    test: {
      name: { label: "integration-isolated", color: "magenta" },
      globals: true,
      setupFiles: ["__tests__/__integration__/setup-integration-tests.ts"],
      globalSetup: "__tests__/__integration__/global-setup.ts",
      include: ["__tests__/__integration__/**/*.isolated.spec.ts"],

      sequence: {
        concurrent: false,
        groupOrder: 2,
      },
      pool: "threads",
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
  },
];
export default defineConfig({
  test: {
    projects: projects,
    globals: true,
    environment: "node",
    pool: "forks",
    coverage: {
      include: ["**/*.ts"],
    },
  },
});
