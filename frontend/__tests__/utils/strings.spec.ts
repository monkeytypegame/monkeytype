import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as Strings from "../../src/ts/utils/strings";

describe("string utils", () => {
  describe("highlightMatches", () => {
    const shouldHighlight = [
      {
        description: "word at the beginning",
        text: "Start here.",
        matches: ["Start"],
        expected: '<span class="highlight">Start</span> here.',
      },
      {
        description: "word at the end",
        text: "reach the end",
        matches: ["end"],
        expected: 'reach the <span class="highlight">end</span>',
      },
      {
        description: "mutliple matches",
        text: "one two three",
        matches: ["one", "three"],
        expected:
          '<span class="highlight">one</span> two <span class="highlight">three</span>',
      },
      {
        description: "repeated matches",
        text: "one two two",
        matches: ["two"],
        expected:
          'one <span class="highlight">two</span> <span class="highlight">two</span>',
      },
      {
        description: "longest possible  match",
        text: "abc ab",
        matches: ["ab", "abc"],
        expected:
          '<span class="highlight">abc</span> <span class="highlight">ab</span>',
      },
      {
        description: "if wrapped in parenthesis",
        text: "(test)",
        matches: ["test"],
        expected: '(<span class="highlight">test</span>)',
      },
      {
        description: "if wrapped in commas",
        text: ",test,",
        matches: ["test"],
        expected: ',<span class="highlight">test</span>,',
      },
      {
        description: "if wrapped in underscores",
        text: "_test_",
        matches: ["test"],
        expected: '_<span class="highlight">test</span>_',
      },
      {
        description: "words in russian",
        text: "Привет, мир!",
        matches: ["Привет", "мир"],
        expected:
          '<span class="highlight">Привет</span>, <span class="highlight">мир</span>!',
      },
      {
        description: "words with chinese punctuation",
        text: "你好，世界！",
        matches: ["你好", "世界"],
        expected:
          '<span class="highlight">你好</span>，<span class="highlight">世界</span>！',
      },
      {
        description: "words with arabic punctuation",
        text: "؟مرحبا، بكم؛",
        matches: ["مرحبا", "بكم"],
        expected:
          '؟<span class="highlight">مرحبا</span>، <span class="highlight">بكم</span>؛',
      },
      {
        description: "standalone numbers",
        text: "My number is 1234.",
        matches: ["1234"],
        expected: 'My number is <span class="highlight">1234</span>.',
      },
    ];
    const shouldNotHighlight = [
      {
        description: "a match within a longer word",
        text: "together",
        matches: ["get"],
      },
      {
        description: "a match with leading letters",
        text: "welcome",
        matches: ["come"],
      },
      {
        description: "a match with trailing letters",
        text: "comets",
        matches: ["come"],
      },
      {
        description: "japanese matches within longer words",
        text: "こんにちは世界",
        matches: ["こんにちは"],
      },
      {
        description: "numbers within words",
        text: "abc1234def",
        matches: ["1234"],
      },
    ];
    const returnOriginal = [
      {
        description: "if matches is an empty array",
        text: "Nothing to match.",
        matches: [],
      },
      {
        description: "if matches has an empty string only",
        text: "Nothing to match.",
        matches: [""],
      },
      {
        description: "if no matches found in text",
        text: "Hello world.",
        matches: ["absent"],
      },
      {
        description: "if text is empty",
        text: "",
        matches: ["anything"],
      },
    ];
    it.each(shouldHighlight)(
      "should highlight $description",
      ({ text, matches, expected }) => {
        expect(Strings.highlightMatches(text, matches)).toBe(expected);
      },
    );
    it.each(shouldNotHighlight)(
      "should not highlight $description",
      ({ text, matches }) => {
        expect(Strings.highlightMatches(text, matches)).toBe(text);
      },
    );
    it.each(returnOriginal)(
      "should return original text $description",
      ({ text, matches }) => {
        expect(Strings.highlightMatches(text, matches)).toBe(text);
      },
    );
  });

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
      },
    );
  });

  describe("getWordDirection", () => {
    it.each([
      // LTR characters should return "ltr"
      ["ltr", "hello", "basic Latin text"],
      ["ltr", "world123", "Latin text with numbers"],
      ["ltr", "test!", "Latin text with punctuation"],
      ["ltr", "ABC", "uppercase Latin text"],
      ["ltr", "", "empty string"],
      ["ltr", "123", "numbers only"],
      ["ltr", "!@#$%", "punctuation and symbols only"],
      ["ltr", "   ", "whitespace only"],

      // Common LTR scripts
      ["ltr", "Здравствуй", "Cyrillic text"],
      ["ltr", "Bonjour", "Latin with accents"],
      ["ltr", "Καλημέρα", "Greek text"],
      ["ltr", "こんにちは", "Japanese Hiragana"],
      ["ltr", "你好", "Chinese characters"],
      ["ltr", "안녕하세요", "Korean text"],

      // strong RTL characters should return "rtl" - Arabic
      ["rtl", "مرحبا", "Arabic text"],
      ["rtl", "السلام", "Arabic phrase"],
      ["rtl", "العربية", "Arabic word"],

      // digits without strong chars return fallback that defaults to ltr
      ["ltr", "٠١٢٣٤٥٦٧٨٩", "Arabic-Indic digits with no strong typed chars"],

      // RTL characters should return "rtl" - Hebrew
      ["rtl", "שלום", "Hebrew text"],
      ["rtl", "עברית", "Hebrew word"],
      ["rtl", "ברוך", "Hebrew name"],

      // RTL characters should return "rtl" - Persian/Farsi
      ["rtl", "سلام", "Persian text"],
      ["rtl", "فارسی", "Persian word"],

      // Mixed content (should return the direction of first strong character if there are both RTL and LTR characters
      ["ltr", "hello مرحبا", "mixed LTR and Arabic"],
      ["rtl", "123 שלום", "numbers and Hebrew"],
      ["ltr", "test سلام!", "Latin, Persian, and punctuation"],
      ["rtl", "مرحبا123", "Arabic with numbers"],
      ["ltr", "hello؟", "Latin with Arabic punctuation"],

      // Edge cases with various Unicode ranges
      ["ltr", "𝕳𝖊𝖑𝖑𝖔", "mathematical bold text (LTR)"],
      ["ltr", "🌍🌎🌏", "emoji"],
    ] as const)(
      "should return %s for word '%s' (%s)",
      (expected: Strings.Direction, word: string, _description: string) => {
        expect(Strings.getWordDirection(word)).toBe(expected);
      },
    );

    it.each([
      // Basic functionality - should use regex pattern when word has core content
      ["ltr", "hello", "ltr", "LTR word in LTR fallback"],
      ["ltr", "hello", "rtl", "LTR word in RTL fallback"],
      ["rtl", "مرحبا", "ltr", "RTL word in LTR fallback"],
      ["rtl", "مرحبا", "rtl", "RTL word in RTL language"],

      // Punctuation stripping behavior
      ["ltr", "hello!", "ltr", "LTR word with trailing punctuation"],
      ["ltr", "!hello", "ltr", "LTR word with leading punctuation"],
      ["ltr", "!hello!", "ltr", "LTR word with surrounding punctuation"],
      ["rtl", "مرحبا؟", "ltr", "RTL word with trailing punctuation"],
      ["rtl", "؟مرحبا", "ltr", "RTL word with leading punctuation"],
      ["rtl", "؟مرحبا؟", "ltr", "RTL word with surrounding punctuation"],

      // Fallback to language direction for empty/neutral content
      ["ltr", "", "ltr", "empty string falls back to LTR"],
      ["rtl", "", "rtl", "empty string falls back to RTL"],
      ["ltr", "!!!", "ltr", "punctuation only falls back to LTR"],
      ["rtl", "!!!", "rtl", "punctuation only falls back to RTL"],
      ["ltr", "   ", "ltr", "whitespace only falls back to LTR"],
      ["rtl", "   ", "rtl", "whitespace only falls back to RTL"],

      // Numbers behavior (numbers are neutral, follow regex detection)
      [
        "ltr",
        "123",
        "ltr",
        "regular digits with no strong typed chars should fallback to ltr",
      ],
      [
        "rtl",
        "123",
        "rtl",
        "regular digits with no strong typed chars should fallback to rtl",
      ],
      [
        "ltr",
        "١٢٣",
        "ltr",
        "Arabic-Indic digits with no strong typed chars should fallback to ltr",
      ],
      [
        "rtl",
        "١٢٣",
        "rtl",
        "Arabic-Indic digits with no strong typed chars should fallback to rtl",
      ],
    ] as const)(
      "should return %s for word '%s' with languageRTL=%s (%s)",
      (
        expected: Strings.Direction,
        word: string,
        fallback: Strings.Direction,
        _description: string,
      ) => {
        expect(Strings.getWordDirection(word, fallback)).toBe(expected);
      },
    );

    it("should return fallback direction for empty word", () => {
      expect(Strings.getWordDirection(undefined, "ltr")).toBe("ltr");
      expect(Strings.getWordDirection(undefined, "rtl")).toBe("rtl");
    });

    it("should fallback to ltr", () => {
      expect(Strings.getWordDirection()).toBe("ltr");
    });

    describe("caching", () => {
      let mapGetSpy: ReturnType<typeof vi.spyOn>;
      let mapSetSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        mapGetSpy = vi.spyOn(Map.prototype, "get");
        mapSetSpy = vi.spyOn(Map.prototype, "set");
      });

      afterEach(() => {
        mapGetSpy.mockRestore();
        mapSetSpy.mockRestore();
      });

      it("should use cache for repeated calls", () => {
        // First call should cache the result (cache miss)
        const result1 = Strings.getWordDirection("firstCheck", "ltr");
        expect(result1).toBe("ltr");
        expect(mapSetSpy).toHaveBeenCalledWith("firstCheck", "ltr");

        // Reset spies to check second call
        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        // Second call should use cache (cache hit)
        const result2 = Strings.getWordDirection("firstCheck", "ltr");
        expect(result2).toBe("ltr");
        expect(mapGetSpy).toHaveBeenCalledWith("firstCheck");
        expect(mapSetSpy).not.toHaveBeenCalled(); // Should not set again

        // Cache should work regardless of fallback direction for same word
        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        const result3 = Strings.getWordDirection("firstCheck", "rtl");
        expect(result3).toBe("ltr"); // Still "ltr" because "hello" is LTR regardless of fallback
        expect(mapGetSpy).toHaveBeenCalledWith("firstCheck");
        expect(mapSetSpy).not.toHaveBeenCalled(); // Should not set again
      });

      it("should demonstrate cache miss vs cache hit behavior", () => {
        // Test cache miss - first time seeing this word
        const result1 = Strings.getWordDirection("unique", "ltr");
        expect(result1).toBe("ltr");
        expect(mapGetSpy).toHaveBeenCalledWith("unique");
        expect(mapSetSpy).toHaveBeenCalledWith("unique", "ltr");

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        // Test cache hit - same word again
        const result2 = Strings.getWordDirection("unique", "ltr");
        expect(result2).toBe("ltr");
        expect(mapGetSpy).toHaveBeenCalledWith("unique");
        expect(mapSetSpy).not.toHaveBeenCalled(); // No cache set on hit

        mapGetSpy.mockClear();
        mapSetSpy.mockClear();

        // Test cache miss - different word
        const result3 = Strings.getWordDirection("different", "ltr");
        expect(result3).toBe("ltr");
        expect(mapGetSpy).toHaveBeenCalledWith("different");
        expect(mapSetSpy).toHaveBeenCalledWith("different", "ltr");
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
      ["\u00A0", 0x00a0, "non-breaking space", true],
      ["\u2007", 0x2007, "figure space", true],
      ["\u2008", 0x2008, "punctuation space", true],
      ["\u200A", 0x200a, "hair space", true],
      ["​", 0x200b, "zero-width space", true],

      // Should return false for other characters
      ["\t", 0x0009, "tab", false],
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
        expected: boolean,
      ) => {
        if (expectedCodePoint !== null && char.length === 1) {
          expect(char.codePointAt(0)).toBe(expectedCodePoint);
        }
        expect(Strings.isSpace(char)).toBe(expected);
      },
    );
  });

  describe("areCharactersVisuallyEqual", () => {
    it("should return true for identical characters", () => {
      expect(Strings.areCharactersVisuallyEqual("a", "a")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("!", "!")).toBe(true);
    });

    it("should return false for different characters", () => {
      expect(Strings.areCharactersVisuallyEqual("a", "b")).toBe(false);
      expect(Strings.areCharactersVisuallyEqual("!", "?")).toBe(false);
    });

    it("should return true for equivalent apostrophe variants", () => {
      expect(Strings.areCharactersVisuallyEqual("'", "'")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("'", "'")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("'", "ʼ")).toBe(true);
    });

    it("should return true for equivalent quote variants", () => {
      expect(Strings.areCharactersVisuallyEqual('"', '"')).toBe(true);
      expect(Strings.areCharactersVisuallyEqual('"', '"')).toBe(true);
      expect(Strings.areCharactersVisuallyEqual('"', "„")).toBe(true);
    });

    it("should return true for equivalent dash variants", () => {
      expect(Strings.areCharactersVisuallyEqual("-", "–")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("-", "—")).toBe(true);
      expect(Strings.areCharactersVisuallyEqual("–", "—")).toBe(true);
    });

    it("should return true for equivalent comma variants", () => {
      expect(Strings.areCharactersVisuallyEqual(",", "‚")).toBe(true);
    });

    it("should return false for characters from different equivalence groups", () => {
      expect(Strings.areCharactersVisuallyEqual("'", '"')).toBe(false);
      expect(Strings.areCharactersVisuallyEqual("-", "'")).toBe(false);
      expect(Strings.areCharactersVisuallyEqual(",", '"')).toBe(false);
    });

    describe("should check russian specific equivalences", () => {
      it.each([
        {
          desc: "е and ё are equivalent",
          char1: "е",
          char2: "ё",
          expected: true,
        },
        {
          desc: "e and ё are equivalent",
          char1: "e",
          char2: "ё",
          expected: true,
        },
        {
          desc: "е and e are equivalent",
          char1: "е",
          char2: "e",
          expected: true,
        },
        {
          desc: "non-equivalent characters return false",
          char1: "а",
          char2: "б",
          expected: false,
        },
        {
          desc: "non-equivalent characters return false (2)",
          char1: "a",
          char2: "б",
          expected: false,
        },
      ])("$desc", ({ char1, char2, expected }) => {
        expect(
          Strings.areCharactersVisuallyEqual(char1, char2, "russian"),
        ).toBe(expected);
      });
    });
  });
});
