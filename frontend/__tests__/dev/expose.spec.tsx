import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

// the harness mocks the modules the debug handle loads (firebase, test logic...)
import "../__harness__/app-shell";

const doc = readFileSync(
  `${import.meta.dirname}/../../../docs/AGENT_BROWSER.md`,
  "utf-8",
);

// members named in the doc: first-column table cells in the `window.__mt`
// section (`name(...)`, `name.<key>`, `a()` / `b()`) and `__mt.name` anywhere
function documentedMembers(): string[] {
  const section = doc.split("## `window.__mt`")[1]?.split("\n## ")[0] ?? "";
  const tableNames = section
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .flatMap((line) =>
      [...(line.split(" | ")[0] ?? "").matchAll(/`(\w+)[(.]/g)].map(
        (m) => m[1],
      ),
    );
  const inlineNames = [...doc.matchAll(/__mt\.(\w+)/g)].map((m) => m[1]);
  return [...new Set([...tableNames, ...inlineNames])].filter(
    (name): name is string => name !== undefined,
  );
}

describe("window.__mt", () => {
  it("has every member AGENT_BROWSER.md names, and the doc lists every member", async () => {
    await import("../../src/ts/dev/expose");
    const members = Object.keys(window.__mt).sort();

    expect(documentedMembers().sort()).toEqual(members);
  });
});
