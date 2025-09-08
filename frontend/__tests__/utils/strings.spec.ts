import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  describe("hasRTLCharacters", () => {
    it.each([
      // LTR characters should return false
      [false, "hello", "basic Latin text"],
      [false, "world123", "Latin text with numbers"],
      [false, "test!", "Latin text with punctuation"],
      [false, "ABC", "uppercase Latin text"],
      [false, "", "empty string"],
      [false, "123", "numbers only"],
      [false, "!@#$%", "punctuation and symbols only"],
      [false, "   ", "whitespace only"],

      // Common LTR scripts
      [false, "Здравствуй", "Cyrillic text"],
      [false, "Bonjour", "Latin with accents"],
      [false, "Καλημέρα", "Greek text"],
      [false, "こんにちは", "Japanese Hiragana"],
      [false, "你好", "Chinese characters"],
      [false, "안녕하세요", "Korean text"],

      // RTL characters should return true - Arabic
      [true, "مرحبا", "Arabic text"],
      [true, "السلام", "Arabic phrase"],
      [true, "العربية", "Arabic word"],
      [true, "٠١٢٣٤٥٦٧٨٩", "Arabic-Indic digits"],

      // RTL characters should return true - Hebrew
      [true, "שלום", "Hebrew text"],
      [true, "עברית", "Hebrew word"],
      [true, "ברוך", "Hebrew name"],

      // RTL characters should return true - Persian/Farsi
      [true, "سلام", "Persian text"],
      [true, "فارسی", "Persian word"],

      // Mixed content (should return true if ANY RTL characters are present)
      [true, "hello مرحبا", "mixed LTR and Arabic"],
      [true, "123 שלום", "numbers and Hebrew"],
      [true, "test سلام!", "Latin, Persian, and punctuation"],
      [true, "مرحبا123", "Arabic with numbers"],
      [true, "hello؟", "Latin with Arabic punctuation"],

      // Edge cases with various Unicode ranges
      [false, "𝕳𝖊𝖑𝖑𝖔", "mathematical bold text (LTR)"],
      [false, "🌍🌎🌏", "emoji"],
    ] as const)(
      "should return %s for word '%s' (%s)",
      (expected: boolean, word: string, _description: string) => {
        expect(Strings.__testing.hasRTLCharacters(word)).toBe(expected);
      }
    );
  });

  describe("getWordDirection", () => {
    beforeEach(() => {
      Strings.clearWordDirectionCache();
    });

    it.each([
      // Basic functionality - should use hasRTLCharacters result when word has core content
      [false, "hello", false, "LTR word in LTR language"],
      [
        false,
        "hello",
        true,
        "LTR word in RTL language (word direction overrides language)",
      ],
      [
        true,
        "مرحبا",
        false,
        "RTL word in LTR language (word direction overrides language)",
      ],
      [true, "مرحبا", true, "RTL word in RTL language"],

      // Punctuation stripping behavior
      [false, "hello!", false, "LTR word with trailing punctuation"],
      [false, "!hello", false, "LTR word with leading punctuation"],
      [false, "!hello!", false, "LTR word with surrounding punctuation"],
      [true, "مرحبا؟", false, "RTL word with trailing punctuation"],
      [true, "؟مرحبا", false, "RTL word with leading punctuation"],
      [true, "؟مرحبا؟", false, "RTL word with surrounding punctuation"],

      // Fallback to language direction for empty/neutral content
      [false, "", false, "empty string falls back to LTR language"],
      [true, "", true, "empty string falls back to RTL language"],
      [false, "!!!", false, "punctuation only falls back to LTR language"],
      [true, "!!!", true, "punctuation only falls back to RTL language"],
      [false, "   ", false, "whitespace only falls back to LTR language"],
      [true, "   ", true, "whitespace only falls back to RTL language"],

      // Numbers behavior (numbers are neutral, follow hasRTLCharacters detection)
      [false, "123", false, "regular digits are not RTL"],
      [false, "123", true, "regular digits are not RTL regardless of language"],
      [true, "١٢٣", false, "Arabic-Indic digits are detected as RTL"],
      [true, "١٢٣", true, "Arabic-Indic digits are detected as RTL"],
    ] as const)(
      "should return %s for word '%s' with languageRTL=%s (%s)",
      (
        expected: boolean,
        word: string,
        languageRTL: boolean,
        _description: string
      ) => {
        expect(Strings.getWordDirection(word, languageRTL)).toBe(expected);
      }
    );

    it("should return languageRTL for undefined word", () => {
      expect(Strings.getWordDirection(undefined, false)).toBe(false);
      expect(Strings.getWordDirection(undefined, true)).toBe(true);
    });

    describe("caching", () => {
      let mapGetSpy: ReturnType<typeof vi.spyOn>;
      let mapSetSpy: ReturnType<typeof vi.spyOn>;
      let mapClearSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        mapGetSpy = vi.spyOn(Map.prototype, "get");
        mapSetSpy = vi.spyOn(Map.prototype, "set");
        mapClearSpy = vi.spyOn(Map.prototype, "clear");
      });

      afterEach(() => {
        mapGetSpy.mockRestore();
        mapSetSpy.mockRestore();
        mapClearSpy.mockRestore();
      });

      it("should use cache for repeated calls", () => {
        // First call should cache the result (cache miss)
        const result1 = Strings.getWordDirection("hello", false);
        expect(result1).toBe(false);
        expect(mapSetSpy).toHaveBeenCalledWith("hello", false);

        // Reset spies to check second call
        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        // Second call should use cache (cache hit)
        const result2 = Strings.getWordDirection("hello", false);
        expect(result2).toBe(false);
        expect(mapGetSpy).toHaveBeenCalledWith("hello");
        expect(mapSetSpy).not.toHaveBeenCalled(); // Should not set again

        // Cache should work regardless of language direction for same word
        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        const result3 = Strings.getWordDirection("hello", true);
        expect(result3).toBe(false); // Still false because "hello" is LTR regardless of language
        expect(mapGetSpy).toHaveBeenCalledWith("hello");
        expect(mapSetSpy).not.toHaveBeenCalled(); // Should not set again
      });

      it("should cache based on core word without punctuation", () => {
        // First call should cache the result for core "hello"
        const result1 = Strings.getWordDirection("hello", false);
        expect(result1).toBe(false);
        expect(mapSetSpy).toHaveBeenCalledWith("hello", false);

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        // These should all use the same cache entry since they have the same core
        const result2 = Strings.getWordDirection("hello!", false);
        expect(result2).toBe(false);
        expect(mapGetSpy).toHaveBeenCalledWith("hello");
        expect(mapSetSpy).not.toHaveBeenCalled();

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        const result3 = Strings.getWordDirection("!hello", false);
        expect(result3).toBe(false);
        expect(mapGetSpy).toHaveBeenCalledWith("hello");
        expect(mapSetSpy).not.toHaveBeenCalled();

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        const result4 = Strings.getWordDirection("!hello!", false);
        expect(result4).toBe(false);
        expect(mapGetSpy).toHaveBeenCalledWith("hello");
        expect(mapSetSpy).not.toHaveBeenCalled();
      });

      it("should handle cache clearing", () => {
        // Cache a result
        Strings.getWordDirection("test", false);
        expect(mapSetSpy).toHaveBeenCalledWith("test", false);

        // Clear cache
        Strings.clearWordDirectionCache();
        expect(mapClearSpy).toHaveBeenCalled();

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();
        mapClearSpy.mockClear();

        // Should work normally after cache clear (cache miss again)
        const result = Strings.getWordDirection("test", false);
        expect(result).toBe(false);
        expect(mapSetSpy).toHaveBeenCalledWith("test", false);
      });

      it("should demonstrate cache miss vs cache hit behavior", () => {
        // Test cache miss - first time seeing this word
        const result1 = Strings.getWordDirection("unique", false);
        expect(result1).toBe(false);
        expect(mapGetSpy).toHaveBeenCalledWith("unique");
        expect(mapSetSpy).toHaveBeenCalledWith("unique", false);

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        // Test cache hit - same word again
        const result2 = Strings.getWordDirection("unique", false);
        expect(result2).toBe(false);
        expect(mapGetSpy).toHaveBeenCalledWith("unique");
        expect(mapSetSpy).not.toHaveBeenCalled(); // No cache set on hit

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        // Test cache miss - different word
        const result3 = Strings.getWordDirection("different", false);
        expect(result3).toBe(false);
        expect(mapGetSpy).toHaveBeenCalledWith("different");
        expect(mapSetSpy).toHaveBeenCalledWith("different", false);
      });
    });
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
