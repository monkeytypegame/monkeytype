import { randomElementFromArray, shuffle } from "../utils/misc";
import { subscribe } from "../observables/config-event";
import * as DB from "../db";

interface Quote {
  text: string;
  source: string;
  length: number;
  id: number;
}

interface QuoteData {
  language: string;
  quotes: Quote[];
  groups: number[][];
}

interface QuoteCollection {
  quotes: MonkeyTypes.Quote[];
  length: number;
  language: string | null;
  groups: MonkeyTypes.Quote[][];
}

const defaultQuoteCollection: QuoteCollection = {
  quotes: [],
  length: 0,
  language: null,
  groups: [],
};

function normalizeLanguage(language: string): string {
  return language.replace(/_\d*k$/g, "");
}

class QuotesController {
  private quoteCollection: QuoteCollection = defaultQuoteCollection;

  private quoteQueue: MonkeyTypes.Quote[] = [];
  private queueIndex = 0;

  async getQuotes(
    language: string,
    quoteLengths?: number[]
  ): Promise<QuoteCollection> {
    const normalizedLanguage = normalizeLanguage(language);

    if (this.quoteCollection.language !== normalizedLanguage) {
      try {
        const data: QuoteData = await $.getJSON(
          `quotes/${normalizedLanguage}.json`
        );

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
        data.quotes.forEach((quote: Quote) => {
          const monkeyTypeQuote: MonkeyTypes.Quote = {
            text: quote.text,
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
      } catch {
        return defaultQuoteCollection;
      }
    }

    return this.quoteCollection;
  }

  getQuoteById(id: number): MonkeyTypes.Quote | undefined {
    const targetQuote = this.quoteCollection.quotes.find(
      (quote: MonkeyTypes.Quote) => {
        return quote.id === id;
      }
    );

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

  getRandomQuote(): MonkeyTypes.Quote | null {
    if (this.quoteQueue.length === 0) {
      return null;
    }

    if (this.queueIndex >= this.quoteQueue.length) {
      this.queueIndex = 0;
      shuffle(this.quoteQueue);
    }

    const randomQuote = this.quoteQueue[this.queueIndex];

    this.queueIndex += 1;

    return randomQuote;
  }

  getCurrentQuote(): MonkeyTypes.Quote | null {
    if (this.quoteQueue.length === 0) {
      return null;
    }

    return this.quoteQueue[this.queueIndex];
  }

  getRandomFavoriteQuote(language: string): MonkeyTypes.Quote | null {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return null;
    }

    const normalizedLanguage = normalizeLanguage(language);
    const quoteIds: string[] = [];
    const { favoriteQuotes } = snapshot;

    Object.keys(favoriteQuotes).forEach((language) => {
      if (normalizeLanguage(language) !== normalizedLanguage) {
        return;
      }

      quoteIds.push(...favoriteQuotes[language]);
    });

    if (quoteIds.length === 0) {
      return null;
    }

    const randomQuoteId = randomElementFromArray(quoteIds);
    const randomQuote = this.getQuoteById(parseInt(randomQuoteId, 10));

    return randomQuote ?? null;
  }

  isQuoteFavorite({ language: quoteLanguage, id }: MonkeyTypes.Quote): boolean {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return false;
    }

    const { favoriteQuotes } = snapshot;

    const normalizedQuoteLanguage = normalizeLanguage(quoteLanguage);

    const matchedLanguage = Object.keys(favoriteQuotes).find((language) => {
      if (normalizedQuoteLanguage !== normalizeLanguage(language)) {
        return false;
      }
      return favoriteQuotes[language].includes(id.toString());
    });

    return matchedLanguage !== undefined;
  }
}

const quoteController = new QuotesController();

subscribe((key, newValue) => {
  if (key === "quoteLength") {
    quoteController.updateQuoteQueue(newValue as number[]);
  }
});

export default quoteController;
