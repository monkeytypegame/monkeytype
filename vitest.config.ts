import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { projects as backendProjects } from "./backend/vitest.config";
import { projects as frontendProjects } from "./frontend/vitest.config";

function convertTests(
  projects: unknown[],
  root: string,
): UserWorkspaceConfig[] {
  return (projects as UserWorkspaceConfig[]).map(
    (it) =>
      ({
        ...it,
        test: {
          ...it.test,
          root,
          name: {
            //TODO better error handling
            ...((it.test ?? {}).name as object),
            label: `${((it.test ?? {}).name as { label: string }).label} (${root})`,
          },
        },
      }) as UserWorkspaceConfig,
  );
}

export default defineConfig({
  test: {
    projects: [
      ...convertTests(backendProjects, "backend"),
      ...convertTests(frontendProjects, "frontend"),
      "packages/**/vitest.config.ts",
    ],
  },
});
