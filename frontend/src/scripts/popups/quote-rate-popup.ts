import Ape from "../ape";
import * as DB from "../db";
import * as TestWords from "../test/test-words";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";

let rating = 0;

type QuoteStats = {
  average?: number;
  ratings?: number;
  totalRating?: number;
  quoteId?: number;
  language?: string;
};

let quoteStats: QuoteStats | null | Record<string, never> = null;
let currentQuote: MonkeyTypes.Quote | null = null;

function reset(): void {
  $(`#quoteRatePopup .quote .text`).text("-");
  $(`#quoteRatePopup .quote .source .val`).text("-");
  $(`#quoteRatePopup .quote .id .val`).text("-");
  $(`#quoteRatePopup .quote .length .val`).text("-");
  $("#quoteRatePopup .ratingCount .val").text("-");
  $("#quoteRatePopup .ratingAverage .val").text("-");
}

function getRatingAverage(quoteStats: QuoteStats): number {
  if (!quoteStats.totalRating || !quoteStats.ratings) {
    return 0;
  }

  return Math.round((quoteStats.totalRating / quoteStats.ratings) * 10) / 10;
}

export async function getQuoteStats(
  quote?: MonkeyTypes.Quote
): Promise<QuoteStats | undefined> {
  if (!quote) {
    return;
  }

  currentQuote = quote;
  const response = await Ape.quotes.getRating(currentQuote);
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to get quote ratings: " + response.message, -1);
    return;
  }

  if (!response.data) {
    return {} as QuoteStats;
  }

  quoteStats = response.data as QuoteStats;
  if (quoteStats && !quoteStats.average) {
    quoteStats.average = getRatingAverage(quoteStats);
  }

  return quoteStats;
}

function refreshStars(force?: number): void {
  const limit = force ? force : rating;
  $(`#quoteRatePopup .star`).removeClass("active");
  for (let i = 1; i <= limit; i++) {
    $(`#quoteRatePopup .star[rating=${i}]`).addClass("active");
  }
}

async function updateRatingStats(): Promise<void> {
  if (!quoteStats) await getQuoteStats();
  $("#quoteRatePopup .ratingCount .val").text(quoteStats?.ratings ?? "0");
  $("#quoteRatePopup .ratingAverage .val").text(
    quoteStats?.average?.toFixed(1) ?? "-"
  );
}

function updateData(): void {
  if (!currentQuote) return;
  let lengthDesc;
  if (currentQuote.group == 0) {
    lengthDesc = "short";
  } else if (currentQuote.group == 1) {
    lengthDesc = "medium";
  } else if (currentQuote.group == 2) {
    lengthDesc = "long";
  } else if (currentQuote.group == 3) {
    lengthDesc = "thicc";
  }
  $(`#quoteRatePopup .quote .text`).text(currentQuote.text);
  $(`#quoteRatePopup .quote .source .val`).text(currentQuote.source);
  $(`#quoteRatePopup .quote .id .val`).text(currentQuote.id);
  $(`#quoteRatePopup .quote .length .val`).text(lengthDesc as string);
  updateRatingStats();
}

export function show(quote: MonkeyTypes.Quote, shouldReset = true): void {
  if ($("#quoteRatePopupWrapper").hasClass("hidden")) {
    if (shouldReset) {
      reset();
    }

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
    $("#quoteRatePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hide(): void {
  if (!$("#quoteRatePopupWrapper").hasClass("hidden")) {
    $("#quoteRatePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#quoteRatePopupWrapper").addClass("hidden");
        }
      );
  }
}

export function clearQuoteStats(): void {
  quoteStats = null;
}

async function submit(): Promise<void> {
  if (rating === 0) {
    return Notifications.add("Please select a rating");
  }
  if (!currentQuote) {
    return;
  }

  hide();

  const response = await Ape.quotes.addRating(currentQuote, rating);
  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add(
      "Failed to submit quote rating: " + response.message,
      -1
    );
  }

  const snapshot = DB.getSnapshot();
  const quoteRatings = snapshot.quoteRatings ?? {};

  if (quoteRatings?.[currentQuote.language]?.[currentQuote.id]) {
    const oldRating = quoteRatings[currentQuote.language][currentQuote.id];
    const diff = rating - oldRating;
    quoteRatings[currentQuote.language][currentQuote.id] = rating;
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
    if (!quoteRatings[currentQuote.language]) {
      quoteRatings[currentQuote.language] = {};
    }
    quoteRatings[currentQuote.language][currentQuote.id] = rating;
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

$("#quoteRatePopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "quoteRatePopupWrapper") {
    hide();
  }
});

$("#quoteRatePopup .stars .star").hover((e) => {
  const ratingHover = parseInt($(e.currentTarget).attr("rating") as string);
  refreshStars(ratingHover);
});

$("#quoteRatePopup .stars .star").on("click", (e) => {
  const ratingHover = parseInt($(e.currentTarget).attr("rating") as string);
  rating = ratingHover;
});

$("#quoteRatePopup .stars .star").mouseout(() => {
  $(`#quoteRatePopup .star`).removeClass("active");
  refreshStars();
});

$("#quoteRatePopup .submitButton").on("click", () => {
  submit();
});

$(".pageTest #rateQuoteButton").on("click", async () => {
  // TODO remove this when done with TestWords
  show(TestWords.randomQuote as unknown as MonkeyTypes.Quote);
});
