import { defineConfig, UserWorkspaceConfig } from "vitest/config";
import { projects as backendProjects } from "./backend/vitest.config";
import { projects as frontendProjects } from "./frontend/vitest.config";

//oxlint-disable-next-line no-explicit-any
let plugins: any[] = [];

export default defineConfig({
  test: {
    projects: [
      ...convertTests(backendProjects, "backend"),
      ...convertTests(frontendProjects, "frontend"),
      "packages/**/vitest.config.ts",
    ],
  },
  plugins,
});

function convertTests(
  projects: unknown[],
  root: string,
): UserWorkspaceConfig[] {
  return (projects as UserWorkspaceConfig[]).map((it) => {
    copySolidPlugin(it);
    const test = it.test ?? {};
    const name: string | { label: string } = test.name ?? "unknown";

    let updatedName =
      name === null || typeof name === "string"
        ? `${name}-${root}`
        : { ...name, label: `${name.label}-${root}` };

    const final = {
      ...it,
      test: {
        ...test,
        root,
        name: updatedName,
      },
    } as UserWorkspaceConfig;

    return final;
  });
}

/**
 * Tests for solidJs need the solid plugin to run on config level and on test level. idk why.
 */
function copySolidPlugin(config: UserWorkspaceConfig): void {
  if (!config.plugins) return;
  config.plugins
    //@ts-expect-error this is fine
    .filter((it) => it["name"] === "solid")
    .forEach((it) => plugins.push(it));
}
