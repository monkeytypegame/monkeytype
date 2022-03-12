import { shuffle } from "../utils/misc";

type QuoteCollection = {
  quotes: MonkeyTypes.Quote[];
  length?: number;
  language?: string;
  groups: number[][] | MonkeyTypes.Quote[][];
};

class QuotesController {
  private quoteCollection: QuoteCollection = {
    quotes: [],
    groups: [],
    length: 0,
  };

  private quoteQueue: MonkeyTypes.Quote[] = [];
  private queueIndex = 0;

  async getQuotes(language: string): Promise<QuoteCollection> {
    const normalizedLanguage = language.replace(/_\d*k$/g, "");

    if (this.quoteCollection.language !== normalizedLanguage) {
      try {
        const data: QuoteCollection = await $.getJSON(
          `quotes/${language}.json`
        );

        if (data.quotes === undefined || data.quotes.length === 0) {
          return {
            quotes: [],
            length: 0,
            groups: [],
          };
        }

        this.quoteCollection = data;
        this.quoteCollection.length = data.quotes.length;
        this.quoteCollection.groups.forEach((quoteGroup, groupIndex) => {
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
      } catch {
        return {
          quotes: [],
          length: 0,
          groups: [],
        };
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
        if (typeof quote !== "number") {
          this.quoteQueue.push(quote);
        }
      });
    });

    shuffle(this.quoteQueue);
    this.queueIndex = 0;
  }

  getRandomQuote(): MonkeyTypes.Quote | null {
    if (this.quoteQueue.length === 0) {
      return null;
    }

    const randomQuote = this.quoteQueue[this.queueIndex];

    this.queueIndex += 1;
    if (this.queueIndex >= this.quoteQueue.length) {
      this.queueIndex = 0;
      shuffle(this.quoteQueue);
    }

    return randomQuote;
  }

  getCurrentQuote(): MonkeyTypes.Quote | null {
    if (this.quoteQueue.length === 0) {
      return null;
    }

    return this.quoteQueue[this.queueIndex];
  }
}

export default new QuotesController();
