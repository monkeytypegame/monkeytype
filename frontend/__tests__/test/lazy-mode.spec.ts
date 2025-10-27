import { describe, it, expect } from "vitest";
import { replaceAccents } from "../../src/ts/test/lazy-mode";

let additionalAccents = [
  ["abc", "1"],
  ["def", "22"],
  ["gh", "333"],
] as [string, string][];

describe("lazy-mode", () => {
  describe("replaceAccents", () => {
    it("should replace common accents", () => {
      const result = replaceAccents("Héllö");
      expect(result).toBe("Hello");
    });
    it("should extend common accents with additional accents", () => {
      const result = replaceAccents("Héllö", [["ö", "oe"]]);
      expect(result).toBe("Helloe");
    });
    it("should remove accent if empty", () => {
      const result = replaceAccents("خصوصًا", [["ٌ", ""]]);
      expect(result).toBe("خصوصا");
    });
    it("should ignore empty word", () => {
      const result = replaceAccents("");
      expect(result).toBe("");
    });
    it("should correctly use additional accents", () => {
      const tests = [
        { input: "abc", expected: "111" },
        { input: "abcdef", expected: "111222222" },
        { input: "gh", expected: "333333" },
        { input: "abcdefgh", expected: "111222222333333" },
        { input: "zzdzz", expected: "zz22zz" },
      ];
      tests.forEach(({ input, expected }) => {
        const result = replaceAccents(input, additionalAccents);
        expect(result).toBe(expected);
      });
    });
  });
});
