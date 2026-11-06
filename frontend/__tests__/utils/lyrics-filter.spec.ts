import { describe, it, expect } from "vitest";

import {
  defaultLyricsFilterOptions,
  filterLyrics,
  findFoldableChars,
  getFoldReplacement,
  lyricsToWords,
  type LyricsFilterOptions,
} from "../../src/ts/utils/lyrics-filter";

// all filters off, so each test enables only what it checks
const off: LyricsFilterOptions = {
  removeSectionHeaders: false,
  brackets: "keep",
  removeSpecialChars: false,
  removePunctuation: false,
  normalizeTypography: false,
  foldDiacritics: false,
  keepChars: "",
  lowercase: false,
  removeRepeatedLines: false,
  lineBreaks: "space",
};

describe("lyrics-filter", () => {
  it("joins lines with spaces and drops empty lines", () => {
    expect(filterLyrics("one two\n\nthree\r\nfour", off)).toBe(
      "one two three four",
    );
  });

  it("uses the custom text newline convention for enter mode", () => {
    const text = filterLyrics("one two\nthree", {
      ...off,
      lineBreaks: "enter",
    });
    expect(text).toBe("one two\n three");
    expect(text.split(" ")).toEqual(["one", "two\n", "three"]);
  });

  describe("section headers", () => {
    it("removes tag-only lines", () => {
      expect(
        filterLyrics("[Chorus]\nhello\n  [Verse 2]  \nworld", {
          ...off,
          removeSectionHeaders: true,
        }),
      ).toBe("hello world");
    });

    it("keeps brackets that are part of a lyric line", () => {
      expect(
        filterLyrics("hello [yeah] world", {
          ...off,
          removeSectionHeaders: true,
        }),
      ).toBe("hello [yeah] world");
    });
  });

  describe("brackets", () => {
    it("removes content, including nested and multi-line", () => {
      expect(
        filterLyrics("hello (ooh (yeah)) world {x} [y]\nfoo (bar\nbaz) end", {
          ...off,
          brackets: "removeContent",
        }),
      ).toBe("hello world foo end");
    });

    it("strips only the bracket characters", () => {
      expect(
        filterLyrics("hello (ooh) [yeah] {no}", {
          ...off,
          brackets: "stripChars",
        }),
      ).toBe("hello ooh yeah no");
    });

    it("a line that is only a parenthetical disappears", () => {
      expect(
        filterLyrics("(ooh)\nhello", { ...off, brackets: "removeContent" }),
      ).toBe("hello");
    });
  });

  describe("special characters", () => {
    it("removes symbols but keeps letters, digits and basic punctuation", () => {
      expect(
        filterLyrics("it's #1 * ~ hit, yeah! <3 100% ok?", {
          ...off,
          removeSpecialChars: true,
        }),
      ).toBe("it's 1 hit, yeah! 3 100 ok?");
    });

    it("replaces & and slashes with readable text", () => {
      expect(
        filterLyrics("rock & roll, black/white", {
          ...off,
          removeSpecialChars: true,
        }),
      ).toBe("rock and roll, black white");
    });

    it("keeps non-latin letters", () => {
      expect(
        filterLyrics("привет, мир ★ 愛してる", {
          ...off,
          removeSpecialChars: true,
        }),
      ).toBe("привет, мир 愛してる");
    });
  });

  describe("punctuation", () => {
    it("removes punctuation, keeps apostrophes and in-word hyphens", () => {
      expect(
        filterLyrics(`"Don't stop", she said - well-known: yes!`, {
          ...off,
          removePunctuation: true,
        }),
      ).toBe("Don't stop she said well-known yes");
    });
  });

  it("normalizes typography", () => {
    expect(
      filterLyrics("“Hello” – it’s me…", { ...off, normalizeTypography: true }),
    ).toBe(`"Hello" - it's me...`);
  });

  it("folds diacritics", () => {
    expect(
      filterLyrics("Café Ünïcode Straße Søren", {
        ...off,
        foldDiacritics: true,
      }),
    ).toBe("Cafe Unicode Strasse Soren");
  });

  describe("keepChars", () => {
    it("folds cedillas in both cases", () => {
      expect(
        filterLyrics("Ça va, garçon", { ...off, foldDiacritics: true }),
      ).toBe("Ca va, garcon");
    });

    it("leaves chosen characters alone and folds the rest", () => {
      expect(
        filterLyrics("Straße über Café Ärger", {
          ...off,
          foldDiacritics: true,
          keepChars: "ßü",
        }),
      ).toBe("Straße über Cafe Arger");
    });

    it("keeps both cases of a chosen character", () => {
      expect(
        filterLyrics("Über über ÜBER", {
          ...off,
          foldDiacritics: true,
          keepChars: "ü",
        }),
      ).toBe("Über über ÜBER");
    });

    it("keepChars does nothing while folding is off", () => {
      expect(filterLyrics("é", { ...off, keepChars: "" })).toBe("é");
    });
  });

  describe("findFoldableChars", () => {
    it("lists distinct lowercase characters that would be folded", () => {
      expect(findFoldableChars("Straße Über café Ç plain ASCII")).toEqual([
        "ç",
        "é",
        "ß",
        "ü",
      ]);
    });

    it("finds decomposed accents too", () => {
      expect(findFoldableChars("cafe\u0301")).toEqual(["é"]);
    });

    it("returns nothing for plain text", () => {
      expect(findFoldableChars("just words")).toEqual([]);
    });
  });

  it("getFoldReplacement", () => {
    expect(getFoldReplacement("Ç")).toBe("C");
    expect(getFoldReplacement("ç")).toBe("c");
    expect(getFoldReplacement("ß")).toBe("ss");
    expect(getFoldReplacement("a")).toBe("a");
  });

  it("does not destroy non-latin combining marks when folding", () => {
    expect(filterLyrics("हिन्दी", { ...off, foldDiacritics: true })).toBe(
      "हिन्दी",
    );
  });

  it("lowercases", () => {
    expect(filterLyrics("Hello WORLD", { ...off, lowercase: true })).toBe(
      "hello world",
    );
  });

  describe("repeated lines", () => {
    it("collapses only consecutive duplicates, ignoring case", () => {
      expect(
        filterLyrics("la la\nLa La\nla la\nother\nla la", {
          ...off,
          removeRepeatedLines: true,
        }),
      ).toBe("la la other la la");
    });

    it("compares after cleaning", () => {
      expect(
        filterLyrics("oh yeah (x2)\noh yeah", {
          ...off,
          brackets: "removeContent",
          removeRepeatedLines: true,
        }),
      ).toBe("oh yeah");
    });
  });

  describe("lyricsToWords", () => {
    it("returns no empty words", () => {
      expect(lyricsToWords("  a   b \n c  ", off)).toEqual(["a", "b", "c"]);
    });

    it("returns [] for lyrics that are only filtered content", () => {
      expect(
        lyricsToWords("[Intro]\n(instrumental)", defaultLyricsFilterOptions),
      ).toEqual([]);
    });

    it("defaults produce clean typeable text", () => {
      expect(
        lyricsToWords(
          "[Verse 1]\n“I’m here” (yeah)\n★ you & me ★",
          defaultLyricsFilterOptions,
        ),
      ).toEqual(["\"I'm", 'here"', "you", "and", "me"]);
    });
  });
});
