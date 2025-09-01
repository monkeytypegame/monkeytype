import { describe, it, expect, beforeEach, vi } from "vitest";
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
      ["hello", false, "basic Latin text"],
      ["world123", false, "Latin text with numbers"],
      ["test!", false, "Latin text with punctuation"],
      ["ABC", false, "uppercase Latin text"],
      ["", false, "empty string"],
      ["123", false, "numbers only"],
      ["!@#$%", false, "punctuation and symbols only"],
      ["   ", false, "whitespace only"],

      // Common LTR scripts
      ["Здравствуй", false, "Cyrillic text"],
      ["Bonjour", false, "Latin with accents"],
      ["Καλημέρα", false, "Greek text"],
      ["こんにちは", false, "Japanese Hiragana"],
      ["你好", false, "Chinese characters"],
      ["안녕하세요", false, "Korean text"],

      // RTL characters should return true - Arabic
      ["مرحبا", true, "Arabic text"],
      ["السلام", true, "Arabic phrase"],
      ["العربية", true, "Arabic word"],
      ["٠١٢٣٤٥٦٧٨٩", true, "Arabic-Indic digits"],

      // RTL characters should return true - Hebrew
      ["שלום", true, "Hebrew text"],
      ["עברית", true, "Hebrew word"],
      ["ברוך", true, "Hebrew name"],

      // RTL characters should return true - Persian/Farsi
      ["سلام", true, "Persian text"],
      ["فارسی", true, "Persian word"],

      // Mixed content (should return true if ANY RTL characters are present)
      ["hello مرحبا", true, "mixed LTR and Arabic"],
      ["123 שלום", true, "numbers and Hebrew"],
      ["test سلام!", true, "Latin, Persian, and punctuation"],
      ["مرحبا123", true, "Arabic with numbers"],
      ["hello؟", true, "Latin with Arabic punctuation"],

      // Edge cases with various Unicode ranges
      ["𝕳𝖊𝖑𝖑𝖔", false, "mathematical bold text (LTR)"],
      ["🌍🌎🌏", false, "emoji"],
    ] as const)(
      "should return %s for '%s' (%s)",
      (word: string, expected: boolean, _description: string) => {
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
      ["hello", false, false, "LTR word in LTR language"],
      [
        "hello",
        true,
        false,
        "LTR word in RTL language (word direction overrides language)",
      ],
      [
        "مرحبا",
        false,
        true,
        "RTL word in LTR language (word direction overrides language)",
      ],
      ["مرحبا", true, true, "RTL word in RTL language"],

      // Punctuation stripping behavior
      ["hello!", false, false, "LTR word with trailing punctuation"],
      ["!hello", false, false, "LTR word with leading punctuation"],
      ["!hello!", false, false, "LTR word with surrounding punctuation"],
      ["مرحبا؟", false, true, "RTL word with trailing punctuation"],
      ["؟مرحبا", false, true, "RTL word with leading punctuation"],
      ["؟مرحبا؟", false, true, "RTL word with surrounding punctuation"],

      // Fallback to language direction for empty/neutral content
      ["", false, false, "empty string falls back to LTR language"],
      ["", true, true, "empty string falls back to RTL language"],
      ["!!!", false, false, "punctuation only falls back to LTR language"],
      ["!!!", true, true, "punctuation only falls back to RTL language"],
      ["   ", false, false, "whitespace only falls back to LTR language"],
      ["   ", true, true, "whitespace only falls back to RTL language"],

      // Numbers behavior (numbers are neutral, follow hasRTLCharacters detection)
      ["123", false, false, "regular digits are not RTL"],
      ["123", true, false, "regular digits are not RTL regardless of language"],
      ["١٢٣", false, true, "Arabic-Indic digits are detected as RTL"],
      ["١٢٣", true, true, "Arabic-Indic digits are detected as RTL"],
    ] as const)(
      "should return %s for word '%s' with languageRTL=%s (%s)",
      (
        word: string,
        languageRTL: boolean,
        expected: boolean,
        _description: string
      ) => {
        expect(Strings.getWordDirection(word, languageRTL)).toBe(expected);
      }
    );

    it("should return languageRTL for undefined word", () => {
      expect(Strings.getWordDirection(undefined, false)).toBe(false);
      expect(Strings.getWordDirection(undefined, true)).toBe(true);
    });

    it("should use cache for repeated calls", () => {
      const mapGetSpy = vi.spyOn(Map.prototype, "get");
      const mapSetSpy = vi.spyOn(Map.prototype, "set");

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

      // Cleanup spies
      mapGetSpy.mockRestore();
      mapSetSpy.mockRestore();
    });

    it("should cache based on core word without punctuation", () => {
      const mapGetSpy = vi.spyOn(Map.prototype, "get");
      const mapSetSpy = vi.spyOn(Map.prototype, "set");

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

      // Cleanup spies
      mapGetSpy.mockRestore();
      mapSetSpy.mockRestore();
    });

    it("should handle cache clearing", () => {
      const mapGetSpy = vi.spyOn(Map.prototype, "get");
      const mapSetSpy = vi.spyOn(Map.prototype, "set");
      const mapClearSpy = vi.spyOn(Map.prototype, "clear");

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

      // Cleanup spies
      mapGetSpy.mockRestore();
      mapSetSpy.mockRestore();
      mapClearSpy.mockRestore();
    });

    it("should demonstrate cache miss vs cache hit behavior", () => {
      const mapGetSpy = vi.spyOn(Map.prototype, "get");
      const mapSetSpy = vi.spyOn(Map.prototype, "set");

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

      // Cleanup spies
      mapGetSpy.mockRestore();
      mapSetSpy.mockRestore();
    });
  });
});
