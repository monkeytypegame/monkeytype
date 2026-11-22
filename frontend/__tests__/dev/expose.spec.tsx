import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

// the harness mocks the modules the debug handle loads (firebase, test logic...)
import "../__harness__/app-shell";

const read = (path: string): string =>
  readFileSync(`${import.meta.dirname}/${path}`, "utf-8");
const doc = read("../../../docs/AGENT_BROWSER.md");
const source = read("../../src/ts/dev/expose.ts");

// the docs live in JSDoc: above the `mt` property, or above the local function
function hasJsDoc(name: string): boolean {
  const docBefore = (pattern: RegExp): boolean =>
    new RegExp(`\\*/\\n${pattern.source}`).test(source);
  return (
    docBefore(new RegExp(`  ${name}[,:]`)) ||
    docBefore(new RegExp(`(async )?function ${name}\\(`))
  );
}

describe("window.__mt", () => {
  it("documents every member with JSDoc in expose.ts", async () => {
    await import("../../src/ts/dev/expose");
    const undocumented = Object.keys(window.__mt).filter(
      (name) => !hasJsDoc(name),
    );

    expect(undocumented).toEqual([]);
  });

  it("has every member AGENT_BROWSER.md names", async () => {
    await import("../../src/ts/dev/expose");
    const named = [...doc.matchAll(/__mt\.(\w+)/g)].map((m) => m[1] ?? "");

    expect(named.filter((name) => !(name in window.__mt))).toEqual([]);
  });
});
