import { createSignal } from "solid-js";
import { Language } from "@monkeytype/schemas/languages";
import Ape from "../ape";
import { Quote } from "../controllers/quotes-controller";
import { showErrorNotification } from "./notifications";
import { showModal } from "./modals";
import { isSafeNumber } from "@monkeytype/util/numbers";

type QuoteStats = {
  average?: number;
  ratings?: number;
  totalRating?: number;
  quoteId?: number;
  language?: Language;
};

const [currentQuote, setCurrentQuote] = createSignal<Quote | null>(null);
const [quoteStats, setQuoteStats] = createSignal<
  QuoteStats | null | Record<string, never>
>(null);

export { currentQuote, quoteStats };

export function clearQuoteStats(): void {
  setQuoteStats(null);
}

export function getRatingAverage(stats: QuoteStats): number {
  if (
    isSafeNumber(stats.ratings) &&
    isSafeNumber(stats.totalRating) &&
    stats.ratings > 0 &&
    stats.totalRating > 0
  ) {
    return Math.round((stats.totalRating / stats.ratings) * 10) / 10;
  }
  return 0;
}

export async function getQuoteStats(
  quote?: Quote,
): Promise<QuoteStats | undefined> {
  if (!quote) return;

  setCurrentQuote(quote);
  const response = await Ape.quotes.getRating({
    query: { quoteId: quote.id, language: quote.language },
  });

  if (response.status !== 200) {
    showErrorNotification("Failed to get quote ratings", { response });
    return;
  }

  if (response.body.data === null) {
    setQuoteStats({});
    return {} as QuoteStats;
  }

  const stats = response.body.data as QuoteStats;
  if (stats !== undefined && stats.average === undefined) {
    stats.average = getRatingAverage(stats);
  }

  setQuoteStats(stats);
  return stats;
}

export function updateQuoteStats(stats: QuoteStats): void {
  setQuoteStats(stats);
}

export function showQuoteRateModal(quote: Quote): void {
  setCurrentQuote(quote);
  showModal("QuoteRate");
}
