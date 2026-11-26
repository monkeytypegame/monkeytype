import { describe, expect, it } from "vitest";
import { QuoteData } from "@monkeytype/schemas/quotes";
import {
  buildLanguageQuotes,
  getQuoteById,
} from "../../src/ts/constants/quotes";

const data: QuoteData = {
  language: "english",
  groups: [
    [0, 10],
    [11, 20],
    [21, 30],
    [31, 9999],
  ],
  quotes: [
    { id: 1, text: "a", source: "s", length: 5 },
    { id: 2, text: "b", source: "s", length: 15, britishText: "bb" },
    { id: 3, text: "c", source: "s", length: 40 },
  ],
};

describe("buildLanguageQuotes", () => {
  it("groups the quotes by length", () => {
    const languageQuotes = buildLanguageQuotes(data);
    expect(languageQuotes.quotes).toHaveLength(3);
    expect(languageQuotes.language).toBe("english");
    expect(languageQuotes.groups.map((g) => g.map((q) => q.id))).toEqual([
      [1],
      [2],
      [],
      [3],
    ]);
    expect(languageQuotes.quotes.map((q) => q.group)).toEqual([0, 1, 3]);
    expect(languageQuotes.quotes[1]).toEqual({
      id: 2,
      text: "b",
      britishText: "bb",
      source: "s",
      length: 15,
      language: "english",
      group: 1,
    });
  });

  it("shares the quote objects between the list and the groups", () => {
    const languageQuotes = buildLanguageQuotes(data);
    expect(languageQuotes.groups[0]?.[0]).toBe(languageQuotes.quotes[0]);
  });

  it("finds a quote by id", () => {
    const languageQuotes = buildLanguageQuotes(data);
    expect(getQuoteById(languageQuotes, 3)?.text).toBe("c");
    expect(getQuoteById(languageQuotes, 9)).toBeUndefined();
  });
});
