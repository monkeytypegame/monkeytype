import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Workspace packages resolve to their source, in the app (dev and build) and
// in tests alike, so neither runs against a stale build of a package's dist.
// Type checking already reads source the same way, via each export's "types".
// The packages' own dist builds (turbo `dev`/`dev-pkg` watchers) now only
// serve the backend.
const packagesDir = fileURLToPath(new URL("../../packages", import.meta.url));

type Alias = { find: RegExp; replacement: string };

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Aliases for every export that points its types at source. */
function packageAliases(dir: string): Alias[] {
  let pkg: { name?: string; exports?: Record<string, unknown> };
  try {
    pkg = JSON.parse(
      readFileSync(`${packagesDir}/${dir}/package.json`, "utf8"),
    ) as typeof pkg;
  } catch {
    return [];
  }
  if (pkg.name === undefined || pkg.exports === undefined) return [];

  const aliases: Alias[] = [];
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    const types = (target as { types?: unknown } | null)?.types;
    if (typeof types !== "string" || !types.startsWith("./src/")) continue;
    const name = escapeRegExp(pkg.name);
    const source = `${packagesDir}/${dir}/${types.slice(2)}`;
    if (subpath === ".") {
      // a declared entry without source falls back to normal resolution
      if (!existsSync(source)) continue;
      aliases.push({ find: new RegExp(`^${name}$`), replacement: source });
    } else if (subpath === "./*") {
      aliases.push({
        find: new RegExp(`^${name}/(.+)$`),
        replacement: source.replace("*", "$1"),
      });
    }
  }
  return aliases;
}

export const workspacePackagesAlias: Alias[] = readdirSync(packagesDir, {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => packageAliases(entry.name));
