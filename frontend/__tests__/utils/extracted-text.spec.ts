import { describe, it, expect } from "vitest";
import {
  groupLinesIntoParagraphs,
  joinWrappedLines,
  mergeBrokenParagraphs,
  paragraphsToText,
  removeMarginalText,
  removePageNumbers,
  splitPlainTextIntoParagraphs,
  textItemsToLines,
} from "../../src/ts/utils/extracted-text";

function item(
  str: string,
  y: number,
  options?: { hasEOL?: boolean; height?: number; x?: number; dir?: string },
): {
  str: string;
  hasEOL: boolean;
  transform: number[];
  height: number;
  dir?: string;
} {
  return {
    str,
    hasEOL: options?.hasEOL ?? false,
    transform: [1, 0, 0, 1, options?.x ?? 72, y],
    height: options?.height ?? 10,
    dir: options?.dir,
  };
}

function line(
  text: string,
  y: number,
  height = 10,
  x = 72,
): { text: string; x: number; y: number; height: number } {
  return { text, x, y, height };
}

/** an A4 page */
function page(lines: ReturnType<typeof line>[]): {
  lines: ReturnType<typeof line>[];
  bottom: number;
  top: number;
} {
  return { lines, bottom: 0, top: 842 };
}

describe("extracted-text", () => {
  describe("textItemsToLines", () => {
    it("merges items until an end of line", () => {
      expect(
        textItemsToLines([
          item("Hello", 700),
          item(" ", 700),
          item("world", 700, { hasEOL: true }),
          item("second line", 688),
        ]),
      ).toEqual([line("Hello world", 700), line("second line", 688)]);
    });

    it("uses the position of the first visible item and the tallest height", () => {
      expect(
        textItemsToLines([
          item("", 500, { height: 0 }),
          item("Title", 746, { height: 18 }),
          item(" suffix", 746, { height: 12, hasEOL: true }),
        ]),
      ).toEqual([line("Title suffix", 746, 18)]);
    });

    it("drops empty lines and collapses whitespace", () => {
      expect(
        textItemsToLines([
          item("  a   b ", 700, { hasEOL: true }),
          item("", 690, { hasEOL: true }),
          item("   ", 680, { hasEOL: true }),
          item("c", 670),
        ]),
      ).toEqual([line("a b", 700), line("c", 670)]);
    });

    it("splits out-of-flow text that is followed by an empty end of line item", () => {
      //this is what pdf.js emits for a footer page number drawn before the body
      expect(
        textItemsToLines([
          item("1", 30, { height: 9 }),
          item("", 746, { height: 0, hasEOL: true }),
          item("Body", 746),
        ]),
      ).toEqual([line("1", 30, 9), line("Body", 746)]);
    });
  });

  describe("textItemsToLines position", () => {
    it("uses the x position of the first visible item", () => {
      expect(
        textItemsToLines([
          item(" ", 700, { x: 40 }),
          item("indented", 700, { x: 90 }),
          item(" line", 700, { x: 140, hasEOL: true }),
        ]),
      ).toEqual([line("indented line", 700, 10, 90)]);
    });

    it("marks lines which are not written left to right", () => {
      expect(
        textItemsToLines([
          item("שלום", 700, { dir: "rtl", hasEOL: true }),
          item("hello", 688, { dir: "ltr" }),
        ]),
      ).toEqual([{ ...line("שלום", 700), notLtr: true }, line("hello", 688)]);
    });
  });

  describe("joinWrappedLines", () => {
    it("joins lines with a space", () => {
      expect(joinWrappedLines(["one two", "three"])).toBe("one two three");
    });

    it("ignores empty lines and surrounding whitespace", () => {
      expect(joinWrappedLines([" one ", "", "  ", "two"])).toBe("one two");
    });

    it("repairs words hyphenated across a line break", () => {
      expect(
        joinWrappedLines(["an efficient combina-", "tion of habits"]),
      ).toBe("an efficient combination of habits");
    });

    it("keeps the hyphen of compound words split across a line break", () => {
      expect(joinWrappedLines(["pre-", "2020 data"])).toBe("pre-2020 data");
      expect(joinWrappedLines(["Jean-", "Luc"])).toBe("Jean-Luc");
    });

    it("treats a spaced dash as punctuation", () => {
      expect(joinWrappedLines(["one thing -", "another"])).toBe(
        "one thing - another",
      );
    });

    it("does not add spaces between wrapped CJK lines", () => {
      expect(joinWrappedLines(["日本語の文", "章です"])).toBe(
        "日本語の文章です",
      );
      expect(joinWrappedLines(["日本語", "text"])).toBe("日本語 text");
    });
  });

  describe("groupLinesIntoParagraphs", () => {
    it("returns nothing for no lines", () => {
      expect(groupLinesIntoParagraphs([])).toEqual([]);
    });

    it("keeps evenly spaced lines in one paragraph", () => {
      expect(
        groupLinesIntoParagraphs([
          line("first", 726),
          line("second", 714),
          line("third", 702),
        ]),
      ).toEqual(["first second third"]);
    });

    it("starts a paragraph on a larger than usual gap", () => {
      expect(
        groupLinesIntoParagraphs([
          line("first", 726),
          line("second", 714),
          line("third", 702),
          line("new paragraph", 672),
          line("continues", 660),
        ]),
      ).toEqual(["first second third", "new paragraph continues"]);
    });

    it("does not split double spaced text", () => {
      expect(
        groupLinesIntoParagraphs([
          line("first", 700),
          line("second", 676),
          line("third", 652),
        ]),
      ).toEqual(["first second third"]);
    });

    it("separates lines with a different font size", () => {
      expect(
        groupLinesIntoParagraphs([
          line("Heading", 746, 18),
          line("body starts", 726),
          line("body ends", 714),
        ]),
      ).toEqual(["Heading", "body starts body ends"]);
    });

    it("starts a paragraph when the text moves back up the page", () => {
      expect(
        groupLinesIntoParagraphs([
          line("left column", 700),
          line("left end", 688),
          line("right column", 700),
          line("right end", 688),
        ]),
      ).toEqual(["left column left end", "right column right end"]);
    });
  });

  describe("groupLinesIntoParagraphs lists and indents", () => {
    it("starts a paragraph for every list item", () => {
      expect(
        groupLinesIntoParagraphs([
          line("• first point", 700),
          line("• second point", 688),
          line("- third point", 676),
          line("1. fourth point", 664),
          line("2) fifth point", 652),
          line("(a) sixth point", 640),
        ]),
      ).toEqual([
        "• first point",
        "• second point",
        "- third point",
        "1. fourth point",
        "2) fifth point",
        "(a) sixth point",
      ]);
    });

    it("keeps the indented wrapped lines of a list item together", () => {
      expect(
        groupLinesIntoParagraphs([
          line("• a long point that", 700, 10, 72),
          line("wraps around", 688, 10, 90),
          line("• next", 676, 10, 72),
        ]),
      ).toEqual(["• a long point that wraps around", "• next"]);
    });

    it("does not treat numbers and dashes inside of a sentence as list items", () => {
      expect(
        groupLinesIntoParagraphs([
          line("it grew by", 700),
          line("3.5 percent in", 688),
          line("2020. Then it -", 676),
          line("-5 degrees", 664),
        ]),
      ).toEqual(["it grew by 3.5 percent in 2020. Then it - -5 degrees"]);
    });

    it("starts a paragraph on an indented first line", () => {
      expect(
        groupLinesIntoParagraphs([
          line("First paragraph starts", 700, 10, 90),
          line("and continues here.", 688, 10, 72),
          line("Second paragraph starts", 676, 10, 90),
          line("and ends.", 664, 10, 72),
        ]),
      ).toEqual([
        "First paragraph starts and continues here.",
        "Second paragraph starts and ends.",
      ]);
    });

    it("ignores small differences of the line start", () => {
      expect(
        groupLinesIntoParagraphs([
          line("one", 700, 10, 72),
          line("two", 688, 10, 75),
        ]),
      ).toEqual(["one two"]);
    });

    it("ignores the indent of lines which are not written left to right", () => {
      expect(
        groupLinesIntoParagraphs([
          { ...line("שורה ראשונה", 700, 10, 72), notLtr: true },
          { ...line("שנייה", 688, 10, 200), notLtr: true },
        ]),
      ).toEqual(["שורה ראשונה שנייה"]);
    });
  });

  describe("removeMarginalText", () => {
    it("removes page numbers in the top and bottom margin", () => {
      expect(
        removeMarginalText([
          page([line("1", 30), line("body", 700), line("Page 1 of 9", 810)]),
        ]),
      ).toEqual([[line("body", 700)]]);
    });

    it("keeps numbers in the body of the page", () => {
      const lines = [line("intro", 700), line("42", 400), line("outro", 300)];
      expect(removeMarginalText([page(lines)])).toEqual([lines]);
    });

    it("removes headers and footers which repeat on most pages", () => {
      expect(
        removeMarginalText([
          page([line("Lecture 7 - page 1", 812), line("one", 700)]),
          page([line("Lecture 7 - page 2", 812), line("two", 700)]),
          page([line("three", 700), line("© Example University", 20)]),
          page([line("four", 700), line("© Example University", 20)]),
          page([line("© Example University", 20)]),
        ]),
      ).toEqual([
        [line("Lecture 7 - page 1", 812), line("one", 700)],
        [line("Lecture 7 - page 2", 812), line("two", 700)],
        [line("three", 700)],
        [line("four", 700)],
        [],
      ]);
    });

    it("removes a header on every page of a short document", () => {
      expect(
        removeMarginalText([
          page([line("My Notes", 812), line("one", 700)]),
          page([line("My Notes", 812), line("two", 700)]),
        ]),
      ).toEqual([[line("one", 700)], [line("two", 700)]]);
    });

    it("keeps marginal text which does not repeat", () => {
      const lines = [line("A title close to the top", 812), line("b", 700)];
      expect(removeMarginalText([page(lines), page([line("c", 700)])])).toEqual(
        [lines, [line("c", 700)]],
      );
    });

    it("keeps marginal text of a single page", () => {
      const lines = [line("A title close to the top", 812), line("b", 700)];
      expect(removeMarginalText([page(lines)])).toEqual([lines]);
    });

    it("keeps text which repeats in the body", () => {
      const lines = [line("Summary", 600), line("text", 500)];
      expect(removeMarginalText([page(lines), page(lines)])).toEqual([
        lines,
        lines,
      ]);
    });

    it("respects the origin of the page", () => {
      expect(
        removeMarginalText([
          {
            lines: [line("7", 1030), line("body", 1500)],
            bottom: 1000,
            top: 1842,
          },
        ]),
      ).toEqual([[line("body", 1500)]]);
    });
  });

  describe("mergeBrokenParagraphs", () => {
    it("joins a paragraph which continues in lower case", () => {
      expect(
        mergeBrokenParagraphs([
          "certainty about remote state is",
          "never available.",
          "Next paragraph.",
        ]),
      ).toEqual([
        "certainty about remote state is never available.",
        "Next paragraph.",
      ]);
    });

    it("repairs a word hyphenated across the break", () => {
      expect(mergeBrokenParagraphs(["an efficient combina-", "tion."])).toEqual(
        ["an efficient combination."],
      );
    });

    it("keeps paragraphs which end a sentence", () => {
      const paragraphs = [
        "It ends here.",
        "and this is odd",
        'He said "no."',
        "then",
      ];
      expect(mergeBrokenParagraphs(paragraphs)).toEqual(paragraphs);
    });

    it("keeps headings and paragraphs which start in upper case", () => {
      const paragraphs = ["Notes on Typing", "Typing practice works"];
      expect(mergeBrokenParagraphs(paragraphs)).toEqual(paragraphs);
    });

    it("keeps list items apart", () => {
      const paragraphs = ["• retries", "• timeouts", "- backoff", "a) jitter"];
      expect(mergeBrokenParagraphs(paragraphs)).toEqual(paragraphs);
    });

    it("returns nothing for nothing", () => {
      expect(mergeBrokenParagraphs([])).toEqual([]);
    });
  });

  describe("splitPlainTextIntoParagraphs", () => {
    it("splits on blank lines and unwraps the rest", () => {
      expect(
        splitPlainTextIntoParagraphs(
          "first line\nsecond line\n\nnext para-\ngraph\n \n\nlast\n",
        ),
      ).toEqual(["first line second line", "next paragraph", "last"]);
    });

    it("handles windows line endings", () => {
      expect(splitPlainTextIntoParagraphs("a\r\nb\r\n\r\nc")).toEqual([
        "a b",
        "c",
      ]);
    });

    it("returns nothing for blank text", () => {
      expect(splitPlainTextIntoParagraphs(" \n\n ")).toEqual([]);
    });
  });

  describe("removePageNumbers", () => {
    it.each([
      [["1", "body"], ["body"]],
      [["body", "12"], ["body"]],
      [["Page 3", "body", "- 4 -"], ["body"]],
      [["body", "3 / 10"], ["body"]],
      [["body", "page 3 of 10"], ["body"]],
    ])("removes leading and trailing page numbers %#", (input, expected) => {
      expect(removePageNumbers(input)).toEqual(expected);
    });

    it("keeps numbers in the middle of a page", () => {
      expect(removePageNumbers(["intro", "42", "outro"])).toEqual([
        "intro",
        "42",
        "outro",
      ]);
    });

    it("keeps text that only contains a number", () => {
      expect(removePageNumbers(["chapter 3 begins", "body"])).toEqual([
        "chapter 3 begins",
        "body",
      ]);
      expect(removePageNumbers(["body", "12345"])).toEqual(["body", "12345"]);
    });

    it("keeps a page that is only a number", () => {
      expect(removePageNumbers(["7"])).toEqual(["7"]);
    });
  });

  describe("paragraphsToText", () => {
    it("joins paragraphs with a new line", () => {
      expect(paragraphsToText(["one", "two"])).toBe("one\ntwo");
    });

    it("skips blank paragraphs and collapses whitespace", () => {
      expect(paragraphsToText(["  one   two ", " ", "", "three"])).toBe(
        "one two\nthree",
      );
    });

    it("expands latin ligatures", () => {
      expect(paragraphsToText(["ﬁnal ﬂoor oﬃce aﬀair baﬄe"])).toBe(
        "final floor office affair baffle",
      );
    });

    it("removes bullets which cannot be typed", () => {
      expect(
        paragraphsToText(["• first", "▪second", "- third", "1. fourth"]),
      ).toBe("first\nsecond\n- third\n1. fourth");
    });

    it("returns an empty string for nothing", () => {
      expect(paragraphsToText([])).toBe("");
    });
  });
});
