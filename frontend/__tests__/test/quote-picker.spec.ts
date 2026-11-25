import { describe, expect, it } from "vitest";
import { QuoteData } from "@monkeytype/schemas/quotes";
import { buildLanguageQuotes } from "../../src/ts/constants/quotes";
import {
  pickFavoriteQuote,
  pickQueuedQuote,
} from "../../src/ts/test/quote-picker";

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
    { id: 2, text: "b", source: "s", length: 6 },
    { id: 3, text: "c", source: "s", length: 7 },
    { id: 4, text: "d", source: "s", length: 15 },
    { id: 5, text: "e", source: "s", length: 40 },
  ],
};

function pickIds(
  languageQuotes: ReturnType<typeof buildLanguageQuotes>,
  lengths: number[],
  count: number,
): (number | undefined)[] {
  return Array.from(
    { length: count },
    () => pickQueuedQuote(languageQuotes, lengths)?.id,
  );
}

describe("pickQueuedQuote", () => {
  it("doesn't repeat a quote until the pool is used up", () => {
    const languageQuotes = buildLanguageQuotes(data);
    const first = pickIds(languageQuotes, [0, 3], 4);
    expect(first.toSorted()).toEqual([1, 2, 3, 5]);
    const second = pickIds(languageQuotes, [0, 3], 4);
    expect(second.toSorted()).toEqual([1, 2, 3, 5]);
  });

  it("rebuilds the queue when the lengths change", () => {
    const languageQuotes = buildLanguageQuotes(data);
    pickIds(languageQuotes, [0], 2);
    expect(pickIds(languageQuotes, [1], 3)).toEqual([4, 4, 4]);
  });

  it("rebuilds the queue for other quotes", () => {
    const languageQuotes = buildLanguageQuotes(data);
    pickIds(languageQuotes, [0], 2);
    const other = buildLanguageQuotes({
      ...data,
      quotes: [{ id: 9, text: "z", source: "s", length: 5 }],
    });
    expect(pickIds(other, [0], 2)).toEqual([9, 9]);
  });

  it("is null when the selected groups are empty", () => {
    const languageQuotes = buildLanguageQuotes(data);
    expect(pickQueuedQuote(languageQuotes, [2])).toBeNull();
    expect(pickQueuedQuote(languageQuotes, [-1])).toBeNull();
  });
});

describe("pickFavoriteQuote", () => {
  it("picks one of the favourites", () => {
    const languageQuotes = buildLanguageQuotes(data);
    expect(pickFavoriteQuote(languageQuotes, ["4"])?.id).toBe(4);
    expect(pickFavoriteQuote(languageQuotes, [])).toBeNull();
    expect(pickFavoriteQuote(languageQuotes, ["99"])).toBeNull();
  });
});
