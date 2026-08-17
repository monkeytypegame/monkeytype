import { describe, it, expect } from "vitest";
import {
  getFunboxFunctions,
  FunboxFunctions,
} from "../../../src/ts/test/funbox/funbox-functions";

describe("funbox functions", () => {
  describe("l33t funbox", () => {
    const funboxFunctions = getFunboxFunctions();
    const l33tFunbox = funboxFunctions.l33t as Required<
      Pick<FunboxFunctions, "alterText">
    >;

    const alterText = (word: string): string =>
      l33tFunbox.alterText(word, 0, word.length);

    it("should convert lowercase letters to l33t speak", () => {
      expect(alterText("hello world")).toBe("h3110 w0r1d");
    });

    it("should handle uppercase letters", () => {
      expect(alterText("Hello")).toBe("H3110");
    });

    it("should handle mixed case", () => {
      expect(alterText("HeLLo")).toBe("H3110");
    });

    it("should keep non-letter characters unchanged", () => {
      expect(alterText("h3llo!")).toBe("h3110!");
    });

    it("should handle spaces", () => {
      const result = alterText("hello world");
      expect(result.startsWith("h3110 ")).toBe(true);
      expect(result.endsWith("w0r1d")).toBe(true);
      expect(result).not.toContain("/");
    });

    it("should handle all l33t characters", () => {
      expect(alterText("abcdefg")).toBe("4bcd3f6");
    });

    it("should handle all l33t characters (uppercase)", () => {
      expect(alterText("ABCDEFG")).toBe("4BCD3F6");
    });

    it("should convert xyz to l33t", () => {
      expect(alterText("xyz")).toBe("xy2");
    });

    it("should handle empty string", () => {
      expect(alterText("")).toBe("");
    });

    it("should handle string with no letters", () => {
      expect(alterText("123 !@#")).toBe("123 !@#");
    });
  });
});
