import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { projects as backendProjects } from "./backend/vitest.config";
import { projects as frontendProjects } from "./frontend/vitest.config";

export default defineConfig({
  test: {
    projects: [
      ...convertTests(backendProjects, "backend"),
      ...convertTests(frontendProjects, "frontend"),
      "packages/**/vitest.config.ts",
    ],
  },
});

function convertTests(
  projects: unknown[],
  root: string,
): UserWorkspaceConfig[] {
  return (projects as UserWorkspaceConfig[]).map((it) => {
    const test = it.test ?? {};
    const name: string | { label: string } = test.name ?? "unknown";

    let updatedName =
      name === null || typeof name === "string"
        ? `${name} (${root}) `
        : { ...name, label: `${name.label} (${root})` };

    return {
      ...it,
      test: {
        ...test,
        root,
        name: updatedName,
      },
    } as UserWorkspaceConfig;
  });
}
