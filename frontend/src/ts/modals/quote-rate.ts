import Ape from "../ape";
import { Quote } from "../controllers/quotes-controller";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";

let rating = 0;

type QuoteStats = {
  average?: number;
  ratings?: number;
  totalRating?: number;
  quoteId?: number;
  language?: string;
};

let quoteStats: QuoteStats | null | Record<string, never> = null;
let currentQuote: Quote | null = null;

export function clearQuoteStats(): void {
  quoteStats = null;
}

function reset(): void {
  $(`#quoteRateModal .quote .text`).text("-");
  $(`#quoteRateModal .quote .source .val`).text("-");
  $(`#quoteRateModal .quote .id .val`).text("-");
  $(`#quoteRateModal .quote .length .val`).text("-");
  $("#quoteRateModal .ratingCount .val").text("-");
  $("#quoteRateModal .ratingAverage .val").text("-");
}

function getRatingAverage(quoteStats: QuoteStats): number {
  if (!quoteStats.totalRating || !quoteStats.ratings) {
    return 0;
  }

  return Math.round((quoteStats.totalRating / quoteStats.ratings) * 10) / 10;
}

export async function getQuoteStats(
  quote?: Quote
): Promise<QuoteStats | undefined> {
  if (!quote) {
    return;
  }

  currentQuote = quote;
  const response = await Ape.quotes.getRating({
    query: { quoteId: currentQuote.id, language: currentQuote.language },
  });
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add(
      "Failed to get quote ratings: " + response.body.message,
      -1
    );
    return;
  }

  if (response.body.data === null) {
    return {} as QuoteStats;
  }

  quoteStats = response.body.data as QuoteStats;
  if (quoteStats !== undefined && !quoteStats.average) {
    quoteStats.average = getRatingAverage(quoteStats);
  }

  return quoteStats;
}

function refreshStars(force?: number): void {
  const limit = force ? force : rating;
  $(`#quoteRateModal .star`).removeClass("active");
  for (let i = 1; i <= limit; i++) {
    $(`#quoteRateModal .star[data-rating=${i}]`).addClass("active");
  }
}

async function updateRatingStats(): Promise<void> {
  if (!quoteStats) await getQuoteStats();
  $("#quoteRateModal .ratingCount .val").text(quoteStats?.ratings ?? "0");
  $("#quoteRateModal .ratingAverage .val").text(
    quoteStats?.average?.toFixed(1) ?? "-"
  );
}

function updateData(): void {
  if (!currentQuote) return;
  let lengthDesc;
  if (currentQuote.group === 0) {
    lengthDesc = "short";
  } else if (currentQuote.group === 1) {
    lengthDesc = "medium";
  } else if (currentQuote.group === 2) {
    lengthDesc = "long";
  } else if (currentQuote.group === 3) {
    lengthDesc = "thicc";
  }
  $(`#quoteRateModal .quote .text`).text(currentQuote.text);
  $(`#quoteRateModal .quote .source .val`).text(currentQuote.source);
  $(`#quoteRateModal .quote .id .val`).text(currentQuote.id);
  $(`#quoteRateModal .quote .length .val`).text(lengthDesc as string);
  void updateRatingStats();
}

export function show(quote: Quote, showOptions?: ShowOptions): void {
  void modal.show({
    ...showOptions,
    beforeAnimation: async () => {
      reset();
      currentQuote = quote;
      rating = 0;
      const snapshot = DB.getSnapshot();
      const alreadyRated =
        snapshot?.quoteRatings?.[currentQuote.language]?.[currentQuote.id];
      if (alreadyRated) {
        rating = alreadyRated;
      }
      refreshStars();
      updateData();
    },
  });
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
  });
}

async function submit(): Promise<void> {
  if (rating === 0) {
    Notifications.add("Please select a rating");
    return;
  }
  if (!currentQuote) {
    return;
  }

  hide(true);

  const response = await Ape.quotes.addRating({
    body: { quoteId: currentQuote.id, language: currentQuote.language, rating },
  });
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add(
      "Failed to submit quote rating: " + response.body.message,
      -1
    );
    return;
  }

  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  const quoteRatings = snapshot.quoteRatings ?? {};

  const languageRatings = quoteRatings?.[currentQuote.language] ?? {};

  if (languageRatings?.[currentQuote.id]) {
    const oldRating = quoteRatings[currentQuote.language]?.[
      currentQuote.id
    ] as number;
    const diff = rating - oldRating;
    languageRatings[currentQuote.id] = rating;
    quoteStats = {
      ratings: quoteStats?.ratings,
      totalRating: isNaN(quoteStats?.totalRating as number)
        ? 0
        : (quoteStats?.totalRating as number) + diff,
      quoteId: currentQuote.id,
      language: currentQuote.language,
    } as QuoteStats;
    Notifications.add("Rating updated", 1);
  } else {
    languageRatings[currentQuote.id] = rating;
    if (quoteStats?.ratings && quoteStats.totalRating) {
      quoteStats.ratings++;
      quoteStats.totalRating += rating;
    } else {
      quoteStats = {
        ratings: 1,
        totalRating: rating,
        quoteId: currentQuote.id,
        language: currentQuote.language,
      } as QuoteStats;
    }
    Notifications.add("Rating submitted", 1);
  }

  snapshot.quoteRatings = quoteRatings;
  DB.setSnapshot(snapshot);

  quoteStats.average = getRatingAverage(quoteStats);
  $(".pageTest #result #rateQuoteButton .rating").text(
    quoteStats.average?.toFixed(1)
  );
  $(".pageTest #result #rateQuoteButton .icon").removeClass("far");
  $(".pageTest #result #rateQuoteButton .icon").addClass("fas");
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector(".submitButton")?.addEventListener("click", () => {
    void submit();
  });
  const starButtons = modalEl.querySelectorAll(".stars button.star");
  for (const button of starButtons) {
    button.addEventListener("click", (e) => {
      const ratingValue = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("data-rating") as string
      );
      rating = ratingValue;
      refreshStars();
    });
    button.addEventListener("mouseenter", (e) => {
      const ratingHover = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("data-rating") as string
      );
      refreshStars(ratingHover);
    });
    button.addEventListener("mouseleave", () => {
      refreshStars();
    });
  }
}

const modal = new AnimatedModal({
  dialogId: "quoteRateModal",
  setup,
});
