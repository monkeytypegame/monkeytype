import { Language } from "@monkeytype/schemas/languages";
import { QuoteData } from "@monkeytype/schemas/quotes";
import { tryCatch } from "@monkeytype/util/trycatch";
import { Quote } from "../types/quotes";
import { cachedFetchJson } from "../utils/json-data";
import { removeLanguageSize } from "../utils/strings";

export type LanguageQuotes = {
  quotes: Quote[];
  language: Language | null;
  groups: Quote[][];
};

export const emptyLanguageQuotes: LanguageQuotes = {
  quotes: [],
  language: null,
  groups: [],
};

export function buildLanguageQuotes(data: QuoteData): LanguageQuotes {
  const groupOf = (length: number): number => {
    const index = data.groups.findLastIndex(
      ([lower, upper]) => length >= lower && length <= upper,
    );
    return index === -1 ? 0 : index;
  };

  const quotes: Quote[] = data.quotes.map((quote) => ({
    text: quote.text,
    britishText: quote.britishText,
    source: quote.source,
    length: quote.length,
    id: quote.id,
    language: data.language,
    group: groupOf(quote.length),
  }));

  const groups = data.groups.map(([lower, upper]) =>
    quotes.filter((quote) => quote.length >= lower && quote.length <= upper),
  );

  return { quotes, groups, language: data.language };
}

/** Swiss german has no quotes of its own and uses the german ones. */
function quotesLanguage(language: Language): string {
  const normalized = removeLanguageSize(language);
  return normalized.startsWith("swiss_german") ? "german" : normalized;
}

// the last loaded quotes: everything that loads quotes uses the test's language
let cached: { language: string; quotes: LanguageQuotes } | null = null;

export async function getLanguageQuotes(
  language: Language,
): Promise<LanguageQuotes> {
  const quotesLang = quotesLanguage(language);
  if (cached?.language === quotesLang) return cached.quotes;

  const { data, error } = await tryCatch(
    cachedFetchJson<QuoteData>(`quotes/${quotesLang}.json`),
  );
  if (error) {
    if (
      error instanceof Error &&
      (error.message.includes("404") ||
        error.message.includes("Content is not JSON"))
    ) {
      return emptyLanguageQuotes;
    }
    throw error;
  }

  if (data.quotes === undefined || data.quotes.length === 0) {
    return emptyLanguageQuotes;
  }

  cached = { language: quotesLang, quotes: buildLanguageQuotes(data) };
  return cached.quotes;
}

export function getQuoteById(
  languageQuotes: LanguageQuotes,
  id: number,
): Quote | undefined {
  return languageQuotes.quotes.find((quote) => quote.id === id);
}
