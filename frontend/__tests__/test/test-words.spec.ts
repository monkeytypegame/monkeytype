import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/ts/test/test-state", () => ({
  activeWordIndex: 0,
}));

import { words } from "../../src/ts/test/test-words";

describe("test-words", () => {
  beforeEach(() => {
    words.reset();
  });

  describe("removeCommitCharacterFromLastWord", () => {
    it("strips a trailing space from the last word", () => {
      words.push({
        text: "the",
        commit: " ",
        direction: "ltr",
        sectionIndex: 0,
      });
      words.push({
        text: "end",
        commit: " ",
        direction: "ltr",
        sectionIndex: 0,
      });
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("strips a trailing newline from the last word", () => {
      words.push({
        text: "line",
        commit: "\n",
        direction: "ltr",
        sectionIndex: 0,
      });
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["line"]);
    });

    it("leaves a bare last word unchanged", () => {
      words.push({
        text: "the",
        commit: " ",
        direction: "ltr",
        sectionIndex: 0,
      });
      words.push({
        text: "end",
        commit: "",
        direction: "ltr",
        sectionIndex: 0,
      });
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("does nothing on an empty list", () => {
      expect(() => words.removeCommitCharacterFromLastWord()).not.toThrow();
      expect(words.get()).toEqual([]);
    });
  });
});
