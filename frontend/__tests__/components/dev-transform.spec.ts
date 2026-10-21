import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { transformWithOxc } from "vite";
import solidPlugin from "vite-plugin-solid";
import { describe, expect, it } from "vitest";

// The dev server runs solid-refresh (HMR) before oxc strips TS. vitest runs
// solid with `hot: false`, so code that only breaks under HMR (e.g. function
// overloads on components) passes tests but blanks the dev app. Replay the
// dev pipeline here.

const srcRoot = path.resolve(__dirname, "../../src");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

type SolidTransform = (
  code: string,
  id: string,
  options?: { ssr?: boolean },
) => Promise<{ code: string } | null>;

describe("dev transform", () => {
  const plugin = solidPlugin();
  (plugin.configResolved as (config: object) => void)({
    command: "serve",
    mode: "development",
  });
  const transform = plugin.transform as unknown as SolidTransform;

  it.each(tsxFiles(srcRoot).map((f) => [path.relative(srcRoot, f), f]))(
    "%s survives solid-refresh + oxc",
    async (_name, file) => {
      const source = readFileSync(file, "utf8");
      const solid = await transform(source, file);
      expect(solid).not.toBeNull();
      await expect(
        transformWithOxc(solid?.code ?? "", file, { lang: "ts" }),
      ).resolves.toBeDefined();
    },
  );
});
