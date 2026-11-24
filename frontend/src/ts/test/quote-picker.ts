import { Quote } from "../types/quotes";
import { randomElementFromArray, shuffle } from "../utils/arrays";
import { getQuoteById, LanguageQuotes } from "../constants/quotes";

// no-repeat queue: the quotes of the selected length groups, shuffled, taken
// in order and reshuffled once used up. Rebuilt on the next pick when the
// quotes or the lengths changed.
let queue: Quote[] = [];
let queueIndex = 0;
let queueSource: LanguageQuotes | null = null;
let queueLengths = "";

function buildQueue(languageQuotes: LanguageQuotes, lengths: number[]): void {
  queue = lengths.flatMap((group) =>
    group < 0 ? [] : (languageQuotes.groups[group] ?? []),
  );
  shuffle(queue);
  queueIndex = 0;
  queueSource = languageQuotes;
  queueLengths = lengths.join(",");
}

/** The next quote of the no-repeat queue for these length groups. */
export function pickQueuedQuote(
  languageQuotes: LanguageQuotes,
  lengths: number[],
): Quote | null {
  if (languageQuotes !== queueSource || lengths.join(",") !== queueLengths) {
    buildQueue(languageQuotes, lengths);
  }
  if (queue.length === 0) return null;

  if (queueIndex >= queue.length) {
    queueIndex = 0;
    shuffle(queue);
  }
  const quote = queue[queueIndex] as Quote;
  queueIndex += 1;
  return quote;
}

/** A random favourite from the language's quotes; `ids` are the favourite quote ids. */
export function pickFavoriteQuote(
  languageQuotes: LanguageQuotes,
  ids: string[],
): Quote | null {
  if (ids.length === 0) return null;
  return (
    getQuoteById(languageQuotes, parseInt(randomElementFromArray(ids), 10)) ??
    null
  );
}
