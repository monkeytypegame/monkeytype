import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/ts/test/test-state", () => ({
  activeWordIndex: 0,
}));

import { words } from "../../src/ts/test/test-words";

describe("test-words", () => {
  beforeEach(() => {
    words.reset();
  });

  describe("push", () => {
    // separators are part of the word text (added by the generator); push stores
    // words verbatim and does not insert or strip separators
    it("appends words verbatim", () => {
      words.push("the ", 0);
      words.push("cat ", 0);
      words.push("sat", 0);
      expect(words.list).toEqual(["the ", "cat ", "sat"]);
    });

    it("tracks length and section indexes", () => {
      words.push("a ", 3);
      words.push("b", 5);
      expect(words.length).toBe(2);
      expect(words.sectionIndexList).toEqual([3, 5]);
    });
  });

  describe("removeCommitCharacterFromLastWord", () => {
    it("strips a trailing space from the last word", () => {
      words.push("the ", 0);
      words.push("end ", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.list).toEqual(["the ", "end"]);
    });

    it("strips a trailing newline from the last word", () => {
      words.push("line\n", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.list).toEqual(["line"]);
    });

    it("leaves a bare last word unchanged", () => {
      words.push("the ", 0);
      words.push("end", 0);
      words.removeCommitCharacterFromLastWord();
      expect(words.list).toEqual(["the ", "end"]);
    });

    it("does nothing on an empty list", () => {
      expect(() => words.removeCommitCharacterFromLastWord()).not.toThrow();
      expect(words.list).toEqual([]);
    });
  });
});
