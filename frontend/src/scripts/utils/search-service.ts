import levenshtein from "damerau-levenshtein";

export interface SearchService<T> {
  query: (query: string) => SearchResult<T>;
}

interface SearchServiceOptions {
  fuzzyMatchSensitivity: number;
  substringMatchSensitivity: number;
  scoreForSimilarMatch: number;
  scoreForSubstringMatch: number;
}

interface ReverseIndex<T> {
  [key: string]: Set<T>;
}

interface TokenMap {
  [key: string]: Set<string>;
}

interface SearchResult<T> {
  results: T[];
  matchedQueryTerms: string[];
}

export type TextExtractor<T> = (element: T) => string;

const DEFAULT_OPTIONS: SearchServiceOptions = {
  fuzzyMatchSensitivity: 0.2, // Value between 0-1. Higher = more tolerant to spelling mistakes, too high and you get nonsense.
  substringMatchSensitivity: 0.25, // Value between 0-1. Higher = more tolerant to substring matches, too high and you get nonsene.
  scoreForSimilarMatch: 0.5, // When ranking results, the score a match gets for having a token that is similar to a search token.
  scoreForSubstringMatch: 2, // When ranking results, the score a match gets for having a token that is a substring of a search query.
};

function getRatio(a: string, b: string): number {
  return Math.min(a.length, b.length) / Math.max(a.length, b.length);
}

export const buildSearchService = <T>(
  data: T[],
  getSearchableText: TextExtractor<T>,
  options: SearchServiceOptions = DEFAULT_OPTIONS
): SearchService<T> => {
  const reverseIndex: ReverseIndex<T> = {};
  const normalizedTokenToOriginal: TokenMap = {};

  const getTokens = (text: string): string[] => {
    return text.match(/[a-zA-Z0-9]+/g) || [];
  };

  data.forEach((element) => {
    const tokens = getTokens(getSearchableText(element));
    tokens.forEach((token) => {
      const normalizedToken = token.toLocaleLowerCase();
      if (!(normalizedToken in normalizedTokenToOriginal)) {
        normalizedTokenToOriginal[normalizedToken] = new Set<string>();
      }

      normalizedTokenToOriginal[normalizedToken].add(token);
      if (!(normalizedToken in reverseIndex)) {
        reverseIndex[normalizedToken] = new Set<T>();
      }

      reverseIndex[normalizedToken].add(element);
    });
  });

  const tokenSet = Object.keys(reverseIndex);

  const query = (searchQuery: string): SearchResult<T> => {
    const searchResult: SearchResult<T> = {
      results: [],
      matchedQueryTerms: [],
    };

    const normalizedSearchQuery = getTokens(searchQuery.toLocaleLowerCase());
    if (normalizedSearchQuery.length === 0) {
      return searchResult;
    }

    const searchQueryRegex = new RegExp(searchQuery, "i");

    const results = new Map<T, number>();
    const matchedTokens = new Set<string>();

    normalizedSearchQuery.forEach((searchToken) => {
      tokenSet.forEach((token) => {
        const { similarity } = levenshtein(token, searchToken);

        const lengthRatio = getRatio(token, searchToken);

        const matchesSearchQuery =
          searchQueryRegex.test(token) &&
          lengthRatio >= 1 - options.substringMatchSensitivity;
        const isSimilar = similarity >= 1 - options.fuzzyMatchSensitivity;

        if (matchesSearchQuery || isSimilar) {
          const matches = reverseIndex[token];
          matches.forEach((match) => {
            const currentCount = results.get(match) ?? 0;
            const score =
              (matchesSearchQuery
                ? options.scoreForSubstringMatch * lengthRatio
                : 0) + (isSimilar ? options.scoreForSimilarMatch : 0);

            results.set(match, currentCount + score);
          });
          normalizedTokenToOriginal[token].forEach((originalToken) => {
            matchedTokens.add(originalToken);
          });
        }
      });
    });

    const orderedResults = [...results]
      .sort((match1, match2) => {
        return match2[1] - match1[1];
      })
      .map((match) => match[0]);

    searchResult.results = orderedResults;
    searchResult.matchedQueryTerms = [...matchedTokens];

    return searchResult;
  };

  return {
    query,
  };
};
