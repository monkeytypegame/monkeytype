import { removeLanguageSize } from "../utils/strings";
import { randomElementFromArray, shuffle } from "../utils/arrays";
import { cachedFetchJson } from "../utils/json-data";
import { subscribe } from "../observables/config-event";
import * as DB from "../db";
import Ape from "../ape";

export type Quote = {
  text: string;
  britishText?: string;
  source: string;
  length: number;
  id: number;
  group: number;
  language: string;
  textSplit?: string[];
};

export type QuoteWithTextSplit = Quote & {
  textSplit: string[];
};

type QuoteData = {
  language: string;
  quotes: {
    text: string;
    britishText?: string;
    source: string;
    length: number;
    id: number;
  }[];
  groups: [number, number][];
};

type QuoteCollection = {
  quotes: Quote[];
  length: number;
  language: string | null;
  groups: Quote[][];
};

const defaultQuoteCollection: QuoteCollection = {
  quotes: [],
  length: 0,
  language: null,
  groups: [],
};

class QuotesController {
  private quoteCollection: QuoteCollection = defaultQuoteCollection;

  private quoteQueue: Quote[] = [];
  private queueIndex = 0;

  async getQuotes(
    language: string,
    quoteLengths?: number[]
  ): Promise<QuoteCollection> {
    const normalizedLanguage = removeLanguageSize(language);

    if (this.quoteCollection.language !== normalizedLanguage) {
      let data: QuoteData;
      try {
        data = await cachedFetchJson<QuoteData>(
          `quotes/${normalizedLanguage}.json`
        );
      } catch (e) {
        if (e instanceof Error && e?.message?.includes("404")) {
          return defaultQuoteCollection;
        } else {
          throw e;
        }
      }

      if (data.quotes === undefined || data.quotes.length === 0) {
        return defaultQuoteCollection;
      }

      this.quoteCollection = {
        quotes: [],
        length: data.quotes.length,
        groups: [],
        language: data.language,
      };

      // Transform JSON Quote schema to MonkeyTypes Quote schema
      data.quotes.forEach((quote) => {
        const monkeyTypeQuote: Quote = {
          text: quote.text,
          britishText: quote.britishText,
          source: quote.source,
          length: quote.length,
          id: quote.id,
          language: data.language,
          group: 0,
        };

        this.quoteCollection.quotes.push(monkeyTypeQuote);
      });

      data.groups.forEach((quoteGroup, groupIndex) => {
        const lower = quoteGroup[0];
        const upper = quoteGroup[1];

        this.quoteCollection.groups[groupIndex] =
          this.quoteCollection.quotes.filter((quote) => {
            if (quote.length >= lower && quote.length <= upper) {
              quote.group = groupIndex;
              return true;
            }
            return false;
          });
      });

      if (quoteLengths !== undefined) {
        this.updateQuoteQueue(quoteLengths);
      }
    }

    return this.quoteCollection;
  }

  getQuoteById(id: number): Quote | undefined {
    const targetQuote = this.quoteCollection.quotes.find((quote: Quote) => {
      return quote.id === id;
    });

    return targetQuote;
  }

  updateQuoteQueue(quoteGroups: number[]): void {
    this.quoteQueue = [];

    quoteGroups.forEach((group) => {
      if (group < 0) {
        return;
      }
      this.quoteCollection.groups[group]?.forEach((quote) => {
        this.quoteQueue.push(quote);
      });
    });

    shuffle(this.quoteQueue);
    this.queueIndex = 0;
  }

  getRandomQuote(): Quote | null {
    if (this.quoteQueue.length === 0) {
      return null;
    }

    if (this.queueIndex >= this.quoteQueue.length) {
      this.queueIndex = 0;
      shuffle(this.quoteQueue);
    }

    const randomQuote = this.quoteQueue[this.queueIndex] as Quote;

    this.queueIndex += 1;

    return randomQuote;
  }

  getRandomFavoriteQuote(language: string): Quote | null {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return null;
    }

    const normalizedLanguage = removeLanguageSize(language);
    const quoteIds: string[] = [];
    const { favoriteQuotes } = snapshot;

    if (favoriteQuotes === undefined) {
      return null;
    }

    Object.keys(favoriteQuotes).forEach((language) => {
      if (removeLanguageSize(language) !== normalizedLanguage) {
        return;
      }

      quoteIds.push(...(favoriteQuotes[language] ?? []));
    });

    if (quoteIds.length === 0) {
      return null;
    }

    const randomQuoteId = randomElementFromArray(quoteIds);
    const randomQuote = this.getQuoteById(parseInt(randomQuoteId, 10));

    return randomQuote ?? null;
  }

  isQuoteFavorite({ language: quoteLanguage, id }: Quote): boolean {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return false;
    }

    const { favoriteQuotes } = snapshot;

    if (favoriteQuotes === undefined) {
      return false;
    }

    const normalizedQuoteLanguage = removeLanguageSize(quoteLanguage);

    const matchedLanguage = Object.keys(favoriteQuotes).find((language) => {
      if (normalizedQuoteLanguage !== removeLanguageSize(language)) {
        return false;
      }
      return (favoriteQuotes[language] ?? []).includes(id.toString());
    });

    return matchedLanguage !== undefined;
  }

  async setQuoteFavorite(quote: Quote, isFavorite: boolean): Promise<void> {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      throw new Error("Snapshot is not available");
    }

    if (!isFavorite) {
      // Remove from favorites
      const response = await Ape.users.removeQuoteFromFavorites({
        body: {
          language: quote.language,
          quoteId: `${quote.id}`,
        },
      });

      if (response.status === 200) {
        const quoteIndex = snapshot.favoriteQuotes?.[quote.language]?.indexOf(
          `${quote.id}`
        ) as number;
        snapshot.favoriteQuotes?.[quote.language]?.splice(quoteIndex, 1);
      } else {
        throw new Error(response.body.message);
      }
    } else {
      // Remove from favorites
      const response = await Ape.users.addQuoteToFavorites({
        body: {
          language: quote.language,
          quoteId: `${quote.id}`,
        },
      });

      if (response.status === 200) {
        if (snapshot.favoriteQuotes === undefined) {
          snapshot.favoriteQuotes = {};
        }
        if (!snapshot.favoriteQuotes[quote.language]) {
          snapshot.favoriteQuotes[quote.language] = [];
        }
        snapshot.favoriteQuotes[quote.language]?.push(`${quote.id}`);
      } else {
        throw new Error(response.body.message);
      }
    }
  }
}

const quoteController = new QuotesController();

subscribe((key, newValue) => {
  if (key === "quoteLength") {
    quoteController.updateQuoteQueue(newValue as number[]);
  }
});

export default quoteController;
