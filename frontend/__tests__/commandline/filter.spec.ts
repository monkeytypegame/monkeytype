import { describe, it, expect } from "vitest";
import { findMatchingCommands } from "../../src/ts/commandline/filter";
import { Command } from "../../src/ts/commandline/types";

function cmd(display: string, extra: Partial<Command> = {}): Command {
  return { id: display, display, ...extra };
}

function found(
  commands: Command[],
  input: string,
  options: { availability?: boolean[]; singleList?: boolean } = {},
): string[] {
  const result = findMatchingCommands(
    commands,
    options.availability ?? commands.map(() => true),
    input,
    options.singleList ?? false,
  );
  return commands.filter((_, i) => result[i]).map((c) => c.id);
}

describe("findMatchingCommands", () => {
  const commands = [
    cmd("Punctuation..."),
    cmd("Numbers..."),
    cmd("Change custom text"),
    cmd("Search for quotes"),
    cmd("Share test settings"),
  ];

  it("finds every command on empty input", () => {
    expect(found(commands, "")).toEqual(commands.map((c) => c.id));
    expect(found(commands, "   ")).toEqual(commands.map((c) => c.id));
  });

  it("excludes unavailable commands", () => {
    expect(
      found(commands, "", { availability: [true, false, true, true, true] }),
    ).not.toContain("Numbers...");
    expect(
      found(commands, "num", {
        availability: [true, false, true, true, true],
      }),
    ).toEqual([]);
  });

  it("matches word prefixes, case insensitively", () => {
    expect(found(commands, "PUNC")).toEqual(["Punctuation..."]);
    expect(found(commands, "cust")).toEqual(["Change custom text"]);
  });

  it("does not match the middle of a word", () => {
    expect(found(commands, "ustom")).toEqual([]);
  });

  it("matches words in any order", () => {
    expect(found(commands, "text change")).toEqual(["Change custom text"]);
  });

  it("only keeps commands with the most matched words", () => {
    // "s" alone would match search, share and settings
    expect(found(commands, "s t")).toEqual(["Share test settings"]);
  });

  it("only keeps the strongest matches", () => {
    // both match one word, but "quotes" is longer than "share"
    expect(found(commands, "share quotes")).toEqual(["Search for quotes"]);
  });

  it("falls back to fewer matched words when nothing matches all", () => {
    expect(found(commands, "quotes nonsense")).toEqual(["Search for quotes"]);
  });

  it("matches each input word against a single display word", () => {
    // both input words would otherwise match "settings"
    const list = [cmd("settings"), cmd("set settings")];
    expect(found(list, "set set")).toEqual(["set settings"]);
  });

  it("ignores punctuation", () => {
    expect(found(commands, "numbers...")).toEqual(["Numbers..."]);
    expect(found([cmd("Quick restart")], "quick-restart")).toEqual([]);
    expect(found([cmd("Re-enable thing")], "reenable")).toEqual([
      "Re-enable thing",
    ]);
  });

  it("matches aliases", () => {
    const list = [cmd("none", { alias: "off" }), cmd("other")];
    expect(found(list, "off")).toEqual(["none"]);
  });

  it("ignores the single list prefix", () => {
    expect(found(commands, ">punc")).toEqual(["Punctuation..."]);
  });

  it("matches the parent display in single list mode", () => {
    const list = [
      cmd("on", { singleListDisplayNoIcon: "Punctuation on" }),
      cmd("on", { id: "numbersOn", singleListDisplayNoIcon: "Numbers on" }),
    ];
    expect(found(list, "punc on", { singleList: true })).toEqual(["on"]);
    expect(found(list, "punc on")).toEqual(["on", "numbersOn"]);
  });
});
