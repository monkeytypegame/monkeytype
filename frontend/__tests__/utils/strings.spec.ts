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
    it.each([
      // Basic tab conversions
      ["\\t", "\t", "single tab"],
      ["\\t\\t\\t", "\t\t\t", "multiple tabs"],
      ["hello\\tworld", "hello\tworld", "tab between words"],
      ["\\tstart", "\tstart", "tab at start"],
      ["end\\t", "end\t", "tab at end"],

      // Basic newline conversions
      ["\\n", " \n", "single newline with space prefix"],
      ["hello\\nworld", "hello \nworld", "newline between words with space"],
      ["\\nstart", " \nstart", "newline at start with space"],
      ["end\\n", "end \n", "newline at end with space"],

      // Complex newline handling (after first two regexes)
      ["a\\n", "a \n", "single char followed by newline gets space prefix"],
      ["hello\\n", "hello \n", "word followed by newline gets space prefix"],

      // Double-escaped sequences (should become single-escaped)
      ["\\\\t", "\\t", "double-escaped tab becomes single-escaped"],
      [
        "\\\\n",
        "\\ \n",
        "double-escaped newline becomes backslash + space + newline",
      ],
      ["\\\\t\\\\n", "\\t\\ \n", "multiple double-escaped sequences"],

      // Mixed scenarios
      [
        "\\t\\n\\\\t",
        "\t \n\\t",
        "mix of tab, newline, and double-escaped tab",
      ],
      [
        "hello\\tworld\\ntest\\\\t",
        "hello\tworld \ntest\\t",
        "complex mixed scenario",
      ],

      // Edge cases
      ["", "", "empty string"],
      ["no escapes", "no escapes", "string with no escape sequences"],
      ["\\", "\\", "single backslash"],
      ["\\x", "\\x", "backslash with non-control character"],

      // Escaped backslashes that don't precede control chars
      ["\\\\", "\\\\", "double backslash not followed by control char"],
      ["\\\\x", "\\\\x", "double backslash followed by non-control char"],
    ])(
      "should convert %s to %s (%s)",
      (input: string, expected: string, _description: string) => {
        expect(Strings.replaceControlCharacters(input)).toBe(expected);
      }
    );
  });

  describe("isSpace", () => {
    it.each([
      // Should return true for directly typable spaces
      [" ", 0x0020, "regular space", true],
      ["\u2002", 0x2002, "en space", true],
      ["\u2003", 0x2003, "em space", true],
      ["\u2009", 0x2009, "thin space", true],
      ["　", 0x3000, "ideographic space", true],

      // Should return false for other characters
      ["\t", 0x0009, "tab", false],
      ["\u00A0", 0x00a0, "non-breaking space", false],
      ["\u2007", 0x2007, "figure space", false],
      ["\u2008", 0x2008, "punctuation space", false],
      ["\u200A", 0x200a, "hair space", false],
      ["​", 0x200b, "zero-width space", false],
      ["a", 0x0061, "letter a", false],
      ["A", 0x0041, "letter A", false],
      ["1", 0x0031, "digit 1", false],
      ["!", 0x0021, "exclamation mark", false],
      ["\n", 0x000a, "newline", false],
      ["\r", 0x000d, "carriage return", false],

      // Edge cases
      ["", null, "empty string", false],
      ["  ", null, "two spaces", false],
      ["ab", null, "two letters", false],
    ])(
      "should return %s for %s (U+%s - %s)",
      (
        char: string,
        expectedCodePoint: number | null,
        description: string,
        expected: boolean
      ) => {
        if (expectedCodePoint !== null && char.length === 1) {
          expect(char.codePointAt(0)).toBe(expectedCodePoint);
        }
        expect(Strings.isSpace(char)).toBe(expected);
      }
    );
  });
});
