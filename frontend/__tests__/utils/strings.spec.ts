import { describe, it, expect } from "vitest";
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
      ["ltr", "hello", "Latin"],
      ["ltr", "world123", "Latin with numbers"],
      ["ltr", "test!", "Latin with punctuation"],
      ["ltr", "Здравствуй", "Cyrillic"],
      ["ltr", "Καλημέρα", "Greek"],
      ["ltr", "こんにちは", "Hiragana"],
      ["ltr", "你好", "Chinese"],
      ["ltr", "안녕하세요", "Korean"],
      ["ltr", "𝕳𝖊𝖑𝖑𝖔", "mathematical letters"],
      ["rtl", "مرحبا", "Arabic"],
      ["rtl", "שלום", "Hebrew"],
      ["rtl", "فارسی", "Persian"],
      ["rtl", "ܫܠܡܐ", "Syriac"],
      ["rtl", "ߒߞߏ", "N'Ko"],
      ["ltr", "hello مرحبا", "LTR first"],
      ["ltr", "test سلام!", "LTR first, with punctuation"],
      ["ltr", "hello؟", "Latin with Arabic punctuation"],
      ["rtl", "مرحبا hello", "RTL first"],
      ["rtl", "مرحبا123", "Arabic with numbers"],
      ["rtl", "123 שלום", "numbers before Hebrew"],
      ["rtl", "؟مرحبا؟", "Arabic inside Arabic punctuation"],
      ["rtl", "؟", "Arabic question mark, strong in Unicode"],
    ] as const)(
      "is %s for '%s' (%s)",
      (expected: Strings.Direction, word: string, _description: string) => {
        // the fallback only applies without a strong character or numeral
        expect(Strings.getWordDirection(word, "ltr")).toBe(expected);
        expect(Strings.getWordDirection(word, "rtl")).toBe(expected);
      },
    );

    it.each([
      ["0123456789", "digits"],
      ["٠١٢٣٤٥٦٧٨٩", "Arabic-Indic digits"],
      ["۱۲۳", "Persian digits"],
      ["١٢٣!", "digits with punctuation"],
    ])("numerals read left to right: '%s' (%s)", (word) => {
      expect(Strings.getWordDirection(word, "rtl")).toBe("ltr");
    });

    it.each([
      ["", "empty"],
      ["!!!", "punctuation"],
      ["،", "Arabic comma"],
      ["   ", "whitespace"],
      ["🌍🌎🌏", "emoji"],
      ["\n", "a newline"],
    ])("uses the fallback for '%s' (%s)", (word) => {
      expect(Strings.getWordDirection(word, "ltr")).toBe("ltr");
      expect(Strings.getWordDirection(word, "rtl")).toBe("rtl");
    });

    it("falls back to the given direction for no word, ltr by default", () => {
      expect(Strings.getWordDirection(undefined, "rtl")).toBe("rtl");
      expect(Strings.getWordDirection()).toBe("ltr");
    });
  });

  describe("reverseDirection", () => {
    it("swaps the direction", () => {
      expect(Strings.reverseDirection("ltr")).toBe("rtl");
      expect(Strings.reverseDirection("rtl")).toBe("ltr");
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

    it("should treat any Unicode space as equivalent to a regular space", () => {
      // IME-produced spaces must match the U+0020 stored as the word separator
      expect(Strings.areCharactersVisuallyEqual("　", " ")).toBe(true); // ideographic
      expect(Strings.areCharactersVisuallyEqual(" ", " ")).toBe(true); // nbsp
      expect(Strings.areCharactersVisuallyEqual(" ", " ")).toBe(true); // en space
      expect(Strings.areCharactersVisuallyEqual(" ", "a")).toBe(false);
      expect(Strings.areCharactersVisuallyEqual(" ", "\n")).toBe(false);
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

  describe("countChars", () => {
    describe("it should count characters correctly", () => {
      const testCases = [
        {
          description: "correct, partial, last, shouldnt count",
          input: {
            inputWord: "hel",
            targetWord: "hello ",
            creditPartial: false,
          },
          expected: {
            allCorrect: 3,
            correctWord: 0,
            incorrect: 0,
            extra: 0,
            missed: 3,
          },
        },
        {
          description: "correct, partial, last, should count",
          input: {
            inputWord: "hel",
            targetWord: "hello ",
            creditPartial: true,
          },
          expected: {
            allCorrect: 3,
            correctWord: 3,
            incorrect: 0,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "correct last",
          input: {
            inputWord: "hello ",
            targetWord: "hello ",
            creditPartial: true,
          },
          expected: {
            allCorrect: 6,
            correctWord: 6,
            incorrect: 0,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "correct last no space",
          input: {
            inputWord: "hello",
            targetWord: "hello ",
            creditPartial: true,
          },
          expected: {
            allCorrect: 5,
            correctWord: 5,
            incorrect: 0,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "incorrect, last word, quick end",
          input: {
            inputWord: "xello",
            targetWord: "hello",
            creditPartial: false,
          },
          expected: {
            allCorrect: 4,
            correctWord: 0,
            incorrect: 1,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "incorrect, last word, early literal space",
          input: {
            inputWord: "he ",
            targetWord: "hello",
            creditPartial: false,
          },
          expected: {
            allCorrect: 2,
            correctWord: 0,
            incorrect: 1,
            extra: 0,
            missed: 2,
          },
        },
        {
          description: "incorrect, last word, noquick end",
          input: {
            inputWord: "xello ",
            targetWord: "hello",
            creditPartial: false,
          },
          expected: {
            allCorrect: 4,
            correctWord: 0,
            incorrect: 1,
            extra: 1,
            missed: 0,
          },
        },
        {
          description: "correct space, incorrect word (literal space)",
          input: {
            inputWord: "helol ",
            targetWord: "hello ",
            creditPartial: false,
          },
          expected: {
            allCorrect: 3,
            correctWord: 0,
            incorrect: 2,
            extra: 1,
            missed: 0,
          },
        },
        {
          description:
            "single incorrect char (literal space — stopOnError=word)",
          input: {
            inputWord: "hxllo ",
            targetWord: "hello ",
            creditPartial: false,
          },
          expected: {
            allCorrect: 4,
            correctWord: 0,
            incorrect: 1,
            extra: 1,
            missed: 0,
          },
        },
        {
          description:
            "last partial match counts correctWord, no trailing space on target",
          input: {
            inputWord: "hel",
            targetWord: "hello",
            creditPartial: true,
          },
          expected: {
            allCorrect: 3,
            correctWord: 3,
            incorrect: 0,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "last incorrect partial word doesn't count missed",
          input: {
            inputWord: "xxx",
            targetWord: "hello",
            creditPartial: true,
          },
          expected: {
            allCorrect: 0,
            correctWord: 0,
            incorrect: 3,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "last partial no count, no trailing space on target",
          input: {
            inputWord: "hel",
            targetWord: "hello",
            creditPartial: false,
          },
          expected: {
            allCorrect: 3,
            correctWord: 0,
            incorrect: 0,
            extra: 0,
            missed: 2,
          },
        },
        {
          description: "partial correct, with space (literal)",
          input: {
            inputWord: "helxx ",
            targetWord: "hello ",
            creditPartial: false,
          },
          expected: {
            allCorrect: 3,
            correctWord: 0,
            incorrect: 2,
            extra: 1,
            missed: 0,
          },
        },
        {
          description: "count extra chars as extra",
          input: {
            inputWord: "abcx",
            targetWord: "abc ",
            creditPartial: true,
          },
          expected: {
            allCorrect: 3,
            correctWord: 0,
            incorrect: 0,
            extra: 1,
            missed: 0,
          },
        },
        {
          description: "count extra chars as extra (with space)",
          input: {
            inputWord: "abcx ",
            targetWord: "abc ",
            creditPartial: true,
          },
          expected: {
            allCorrect: 3,
            correctWord: 0,
            incorrect: 1,
            extra: 1,
            missed: 0,
          },
        },
        {
          description:
            "incorrect last word, trailing literal space, timed (stopOnError=word)",
          input: {
            inputWord: "jhow ",
            targetWord: "how",
            creditPartial: true,
          },
          expected: {
            allCorrect: 0,
            correctWord: 0,
            incorrect: 3,
            extra: 2,
            missed: 0,
          },
        },
        {
          description:
            "trailing literal space past target — counts as extra (stopOnError=word)",
          input: {
            inputWord: "xow ",
            targetWord: "how",
            creditPartial: true,
          },
          expected: {
            allCorrect: 2,
            correctWord: 0,
            incorrect: 1,
            extra: 1,
            missed: 0,
          },
        },
        {
          description:
            "multiple literal trailing spaces on wrong word — all count as extra",
          input: {
            inputWord: "xonl  ",
            targetWord: "only ",
            creditPartial: true,
          },
          expected: {
            allCorrect: 0,
            correctWord: 0,
            incorrect: 4,
            extra: 2,
            missed: 0,
          },
        },
        {
          description:
            "early literal space at non-space slot with creditPartial — counts as incorrect",
          input: {
            inputWord: "x ",
            targetWord: "get",
            creditPartial: true,
          },
          expected: {
            allCorrect: 0,
            correctWord: 0,
            incorrect: 2,
            extra: 0,
            missed: 0,
          },
        },
        {
          description:
            "incorrect word with literal trailing space — uncommitted (stopOnError=word)",
          input: {
            inputWord: "xello ",
            targetWord: "hello ",
            creditPartial: false,
          },
          expected: {
            allCorrect: 4,
            correctWord: 0,
            incorrect: 1,
            extra: 1,
            missed: 0,
          },
        },
        {
          description: "empty input with creditPartial",
          input: {
            inputWord: "",
            targetWord: "hello",
            creditPartial: true,
          },
          expected: {
            allCorrect: 0,
            correctWord: 0,
            incorrect: 0,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "correct last word, no trailing space anywhere",
          input: {
            inputWord: "hello",
            targetWord: "hello",
            creditPartial: false,
          },
          expected: {
            allCorrect: 5,
            correctWord: 5,
            incorrect: 0,
            extra: 0,
            missed: 0,
          },
        },
        {
          description: "mid-word literal space followed by more input",
          input: {
            inputWord: "hel o",
            targetWord: "hello ",
            creditPartial: false,
          },
          expected: {
            allCorrect: 4,
            correctWord: 0,
            incorrect: 1,
            extra: 0,
            missed: 1,
          },
        },
      ];

      it.each(testCases)("$description", ({ input, expected }) => {
        expect(
          Strings.countChars(
            input.inputWord,
            input.targetWord,
            input.creditPartial,
          ),
        ).toEqual(expected);
      });
    });
  });
});
