import { describe, it, expect } from "vitest";
import {
  getFunboxFunctions,
  FunboxFunctions,
} from "../../../src/ts/test/funbox/funbox-functions";

describe("funbox functions", () => {
  describe("leet funbox", () => {
    const funboxFunctions = getFunboxFunctions();
    const leetFunbox = funboxFunctions.leet as Required<
      Pick<FunboxFunctions, "alterText">
    >;

    const alterText = (word: string): string =>
      leetFunbox.alterText(word, 0, word.length);

    it("should convert lowercase letters to leet speak", () => {
      expect(alterText("hello world")).toBe("#3110 \\/\\/0I21)");
    });

    it("should handle uppercase letters", () => {
      expect(alterText("Hello")).toBe("#3110");
    });

    it("should handle mixed case", () => {
      expect(alterText("HeLLo")).toBe("#3110");
    });

    it("should keep non-letter characters unchanged", () => {
      expect(alterText("h3llo!")).toBe("#3110!");
    });

    it("should handle spaces", () => {
      const result = alterText("hello world");
      expect(result.startsWith("#3110 ")).toBe(true);
      expect(result.endsWith("0I21)")).toBe(true);
      expect(result).toContain("/");
    });

    it("should handle all leet characters", () => {
      expect(alterText("abcdefg")).toBe("4I3[)3|=6");
    });

    it("should handle all leet characters (uppercase)", () => {
      expect(alterText("ABCDEFG")).toBe("4I3[)3|=6");
    });

    it("should convert xyz to leet", () => {
      expect(alterText("xyz")).toBe("><j2");
    });

    it("should handle empty string", () => {
      expect(alterText("")).toBe("");
    });

    it("should handle string with no letters", () => {
      expect(alterText("123 !@#")).toBe("123 !@#");
    });
  });
});
