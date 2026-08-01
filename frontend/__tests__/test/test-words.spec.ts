import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/ts/states/test", () => ({
  getActiveWordIndex: () => 0,
}));

import { words } from "../../src/ts/test/test-words";

describe("test-words", () => {
  beforeEach(() => {
    words.reset();
  });

  describe("push", () => {
    // separators are added by the generator as a trailing space/newline; push
    // splits that into the commit char while keeping the bare word as text
    it("splits the trailing separator into the commit char", () => {
      words.push("the ", 0);
      words.push("cat ", 0);
      words.push("sat", 0);
      expect(words.get().map((w) => w.text)).toEqual(["the", "cat", "sat"]);
      expect(words.get().map((w) => w.commit)).toEqual([" ", " ", ""]);
      expect(words.get().map((w) => w.textWithCommit)).toEqual([
        "the ",
        "cat ",
        "sat",
      ]);
    });

    it("tracks length and section indexes", () => {
      words.push("a ", 3);
      words.push("b", 5);
      expect(words.length).toBe(2);
      expect(words.get().map((w) => w.sectionIndex)).toEqual([3, 5]);
    });
  });

  describe("removeCommitCharacterFromLastWord", () => {
    it("strips a trailing space from the last word", () => {
      words.push("the ", 0);
      words.push("end ", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("strips a trailing newline from the last word", () => {
      words.push("line\n", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["line"]);
    });

    it("leaves a bare last word unchanged", () => {
      words.push("the ", 0);
      words.push("end", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.get().map((w) => w.textWithCommit)).toEqual(["the ", "end"]);
    });

    it("does nothing on an empty list", () => {
      expect(() => words.removeCommitCharacterFromLastWord()).not.toThrow();
      expect(words.get()).toEqual([]);
    });
  });
});
