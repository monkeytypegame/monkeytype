import { describe, it, expect } from "vitest";
import * as Strings from "../../src/ts/utils/strings";

describe("string utils", () => {
  describe("splitIntoCharacters", () => {
    it("splits regular characters", () => {
      expect(Strings.splitIntoCharacters("abc")).toEqual(["a", "b", "c"]);
    });
    it("splits characters outside of the bmp", () => {
      expect(Strings.splitIntoCharacters("t𐑩e")).toEqual(["t", "𐑩", "e"]);
    });
  });
  describe("replaceControlCharacters", () => {
    it("converts \\t\\t\\t to literal tabs", () => {
      expect(Strings.replaceControlCharacters("\\t\\t\\t")).toEqual("\t\t\t");
    });
    it("converts \\t to literal tab", () => {
      expect(Strings.replaceControlCharacters("\\t")).toEqual("\t");
    });
  });
});
