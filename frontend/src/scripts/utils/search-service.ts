import levenshtein from "damerau-levenshtein";

export interface SearchService<T> {
  query: (query: string) => SearchResult<T>;
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

export const buildSearchService = <T>(
  data: T[],
  getSearchableText: TextExtractor<T>
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
    const searchQueryRegex = new RegExp(searchQuery, "i");

    const searchResult: SearchResult<T> = {
      results: [],
      matchedQueryTerms: [],
    };

    const normalizedSearchQuery = getTokens(searchQuery.toLocaleLowerCase());
    if (normalizedSearchQuery.length === 0) {
      return searchResult;
    }

    const results = new Set<T>();
    const matchedTokens = new Set<string>();

    normalizedSearchQuery.forEach((searchToken) => {
      tokenSet.forEach((token) => {
        const { similarity } = levenshtein(token, searchToken);

        if (searchQueryRegex.test(token) || similarity >= 0.75) {
          const matches = reverseIndex[token];
          matches.forEach((match) => {
            results.add(match);
          });
          normalizedTokenToOriginal[token].forEach((originalToken) => {
            matchedTokens.add(originalToken);
          });
        }
      });
    });

    searchResult.results = [...results];
    searchResult.matchedQueryTerms = [...matchedTokens];

    console.log(searchQuery, searchResult.matchedQueryTerms);

    return searchResult;
  };

  return {
    query,
  };
};

// const reg = new RegExp(searchText, "i");
// const found: MonkeyTypes.Quote[] = [];
// quotes.quotes.forEach((quote) => {
//   const quoteText = quote["text"].replace(/[.,'"/#!$%^&*;:{}=\-_`~()]/g, "");
//   const test1 = reg.test(quoteText);
//   if (test1) {
//     found.push(quote);
//   }
// });
// quotes.quotes.forEach((quote) => {
//   const quoteSource = quote["source"].replace(
//     /[.,'"/#!$%^&*;:{}=\-_`~()]/g,
//     ""
//   );
//   const quoteId = quote["id"];
//   const test2 = reg.test(quoteSource);
//   const test3 = reg.test(quoteId.toString());
//   if ((test2 || test3) && found.filter((q) => q.id == quote.id).length == 0) {
//     found.push(quote);
//   }
// });

// setTimeout(() => {
//   let searchText = (<HTMLInputElement>document.getElementById("searchBox"))
//     .value;
//   searchText = searchText
//     .replace(/[.,'"/#!$%^&*;:{}=\-_`~()]/g, "")
//     .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

//   updateResults(searchText);
// }, 0.1); //arbitrarily v. small time as it's only to allow text to input before searching
