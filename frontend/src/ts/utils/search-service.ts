import { stemmer } from "stemmer";
import levenshtein from "damerau-levenshtein";

export type SearchService<T> = {
  query: (query: string) => SearchResult<T>;
};

type SearchServiceOptions = {
  fuzzyMatchSensitivity: number;
  scoreForSimilarMatch: number;
  scoreForExactMatch: number;
};

type InternalDocument = {
  id: number;
  maxTermFrequency: number;
  termFrequencies: Record<string, number>;
};

type ReverseIndex = Record<string, Set<InternalDocument>>;

type TokenMap = Record<string, Set<string>>;

type SearchResult<T> = {
  results: T[];
  matchedQueryTerms: string[];
};

export type TextExtractor<T> = (document: T) => string;

const DEFAULT_OPTIONS: SearchServiceOptions = {
  fuzzyMatchSensitivity: 0.2, // Value between 0-1. Higher = more tolerant to spelling mistakes, too high and you get nonsense.
  scoreForSimilarMatch: 0.5, // When ranking results, the score a match gets for having a token that is similar to a search token.
  scoreForExactMatch: 1, // When ranking results, the score a match gets for having an exact match with a token in the search query.
};

function inverseDocumentFrequency(
  numberOfDocuments: number,
  numberOfDocumentsWithTerm: number
): number {
  if (numberOfDocumentsWithTerm === 0) {
    return 0;
  }

  return Math.log10(numberOfDocuments / numberOfDocumentsWithTerm);
}

const ALPHA = 0.4; // Smoothing term that dampens the contribution of tf/max tf

function normalizedTermFrequency(
  term: string,
  document: InternalDocument
): number {
  return (
    ALPHA +
    (1 - ALPHA) *
      ((document.termFrequencies[term] as number) / document.maxTermFrequency)
  );
}

function tokenize(text: string): string[] {
  return text.match(/[^\\\][.,"/#!?$%^&*;:{}=\-_`~()\s]+/g) ?? [];
}

export const buildSearchService = <T>(
  documents: T[],
  getSearchableText: TextExtractor<T>,
  options: SearchServiceOptions = DEFAULT_OPTIONS
): SearchService<T> => {
  const reverseIndex: ReverseIndex = {};
  const normalizedTokenToOriginal: TokenMap = {};

  documents.forEach((document, documentIndex) => {
    const rawTokens = tokenize(getSearchableText(document));

    const internalDocument: InternalDocument = {
      id: documentIndex,
      termFrequencies: {},
      maxTermFrequency: 0,
    };

    let maxTermFrequency = 0;

    rawTokens.forEach((token) => {
      const stemmedToken = stemmer(token);

      if (!Object.hasOwn(normalizedTokenToOriginal, stemmedToken)) {
        normalizedTokenToOriginal[stemmedToken] = new Set<string>();
      }
      normalizedTokenToOriginal[stemmedToken]?.add(token);

      if (!Object.hasOwn(reverseIndex, stemmedToken)) {
        reverseIndex[stemmedToken] = new Set<InternalDocument>();
      }
      reverseIndex[stemmedToken]?.add(internalDocument);

      if (!(stemmedToken in internalDocument.termFrequencies)) {
        internalDocument.termFrequencies[stemmedToken] = 0;
      }

      (internalDocument.termFrequencies[stemmedToken] as number)++;
      maxTermFrequency = Math.max(
        maxTermFrequency,
        internalDocument.termFrequencies[stemmedToken] as number
      );
    });

    internalDocument.maxTermFrequency = maxTermFrequency;
  });

  const tokenSet = Object.keys(reverseIndex);

  const query = (searchQuery: string): SearchResult<T> => {
    const searchResult: SearchResult<T> = {
      results: [],
      matchedQueryTerms: [],
    };

    const normalizedSearchQuery = new Set<string>(
      tokenize(searchQuery).map((token) => stemmer(token))
    );
    if (normalizedSearchQuery.size === 0) {
      return searchResult;
    }

    const results = new Map<number, number>();
    const matchedTokens = new Set<string>();

    normalizedSearchQuery.forEach((searchToken) => {
      tokenSet.forEach((token) => {
        const { similarity } = levenshtein(searchToken, token);

        const matchesSearchToken = token === searchToken;
        const isSimilar = similarity >= 1 - options.fuzzyMatchSensitivity;

        if (matchesSearchToken || isSimilar) {
          const documentMatches = reverseIndex[token] as Set<InternalDocument>;

          const idf = inverseDocumentFrequency(
            documents.length,
            documentMatches.size
          );
          documentMatches.forEach((document) => {
            const currentScore = results.get(document.id) ?? 0;

            const termFrequency = normalizedTermFrequency(token, document);

            const scoreForExactMatch = matchesSearchToken
              ? options.scoreForExactMatch
              : 0;
            const scoreForSimilarity = isSimilar
              ? options.scoreForSimilarMatch
              : 0;
            const score = scoreForExactMatch + scoreForSimilarity;

            const scoreForToken = score * idf * termFrequency;

            results.set(document.id, currentScore + scoreForToken);
          });

          normalizedTokenToOriginal[token]?.forEach((originalToken) => {
            matchedTokens.add(originalToken);
          });
        }
      });
    });

    const orderedResults = [...results]
      .sort((match1, match2) => {
        return match2[1] - match1[1];
      })
      .map((match) => documents[match[0]]) as T[];

    searchResult.results = orderedResults;
    searchResult.matchedQueryTerms = [...matchedTokens];

    return searchResult;
  };

  return {
    query,
  };
};
