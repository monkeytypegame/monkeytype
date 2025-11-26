import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { projects as backendProjects } from "./backend/vitest.config";

export default defineConfig({
  test: {
    projects: [
      ...backendProjects.map(
        (it) =>
          ({ test: { ...it.test, root: "backend" } }) as UserWorkspaceConfig,
      ),
      "frontend/vitest.config.ts",
      "packages/**/vitest.config.ts",
    ],
  },
});
