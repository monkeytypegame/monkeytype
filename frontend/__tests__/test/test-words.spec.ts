import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/ts/test/test-state", () => ({
  activeWordIndex: 0,
}));

import { words } from "../../src/ts/test/test-words";

describe("test-words", () => {
  beforeEach(() => {
    words.reset();
    words.setNospace(false);
  });

  describe("push (separator storage)", () => {
    it("stores the separator as a trailing space on each non-last word", () => {
      words.push("the", 0);
      words.push("cat", 0);
      words.push("sat", 0);
      expect(words.list).toEqual(["the ", "cat ", "sat"]);
    });

    it("leaves a single word bare", () => {
      words.push("hello", 0);
      expect(words.list).toEqual(["hello"]);
    });

    it("terminates the previous word as new words are appended mid-test", () => {
      words.push("a", 0);
      expect(words.list).toEqual(["a"]);
      words.push("b", 0);
      expect(words.list).toEqual(["a ", "b"]);
    });

    it("does not add a space after a newline-terminated word", () => {
      words.push("line\n", 0);
      words.push("next", 0);
      expect(words.list).toEqual(["line\n", "next"]);
    });

    it("adds no separators when nospace is set", () => {
      words.setNospace(true);
      words.push("猫", 0);
      words.push("犬", 0);
      expect(words.list).toEqual(["猫", "犬"]);
    });
  });
});
