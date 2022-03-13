import { shuffle } from "../utils/misc";
import { subscribe } from "../observables/config-event";

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

class QuotesController {
  private quoteCollection: QuoteCollection = defaultQuoteCollection;

  private quoteQueue: MonkeyTypes.Quote[] = [];
  private queueIndex = 0;

  async getQuotes(
    language: string,
    quoteLengths?: number[]
  ): Promise<QuoteCollection> {
    const normalizedLanguage = language.replace(/_\d*k$/g, "");

    if (this.quoteCollection.language !== normalizedLanguage) {
      try {
        const data: QuoteData = await $.getJSON(`quotes/${language}.json`);

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
            language: language,
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
}

const quoteController = new QuotesController();

subscribe((key, newValue) => {
  if (key === "quoteLength") {
    quoteController.updateQuoteQueue(newValue as number[]);
  }
});

export default quoteController;
