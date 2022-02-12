// @ts-ignore
import * as DB from "../db";
// @ts-ignore
import * as Loader from "../elements/loader";
// @ts-ignore
import * as TestWords from "../test/test-words";
import axiosInstance from "../axios-instance";
import * as Notifications from "../elements/notifications";
import { AxiosError } from "axios";
import * as Types from "../types/interfaces";

let rating = 0;

type QuoteStats = {
  average: number;
  ratings: number;
  totalRating: number;
  quoteId: number;
  language: string;
};

type QuoteRatings = {
  [language: string]: {
    [id: string]: number;
  };
};

let quoteStats: QuoteStats | null | Record<string, never> = null;
let currentQuote: Types.Quote | null = null;

function reset(): void {
  $(`#quoteRatePopup .quote .text`).text("-");
  $(`#quoteRatePopup .quote .source .val`).text("-");
  $(`#quoteRatePopup .quote .id .val`).text("-");
  $(`#quoteRatePopup .quote .length .val`).text("-");
  $("#quoteRatePopup .ratingCount .val").text("-");
  $("#quoteRatePopup .ratingAverage .val").text("-");
}

export async function getQuoteStats(
  quote?: Types.Quote
): Promise<QuoteStats | undefined> {
  if (quote) currentQuote = quote;
  let response;
  try {
    response = await axiosInstance.get("/quotes/rating", {
      params: { quoteId: currentQuote?.id, language: currentQuote?.language },
    });
  } catch (error) {
    const e = error as AxiosError;
    Loader.hide();
    const msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to get quote ratings: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200 && response.status !== 204) {
    Notifications.add(response.data.message);
  } else {
    if (response.status === 204) {
      quoteStats = {};
    } else {
      quoteStats = response.data;
      if (quoteStats && !quoteStats.average) {
        quoteStats.average =
          Math.round((quoteStats.totalRating / quoteStats.ratings) * 10) / 10;
      }
    }
    return quoteStats as QuoteStats;
  }
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

export function show(quote: Types.Quote, shouldReset = true): void {
  if ($("#quoteRatePopupWrapper").hasClass("hidden")) {
    if (shouldReset) {
      reset();
    }

    currentQuote = quote;
    rating = 0;
    const alreadyRated = DB.getSnapshot().quoteRatings?.[
      currentQuote.language
    ]?.[currentQuote.id];
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
  if (rating == 0) {
    Notifications.add("Please select a rating");
    return;
  }
  if (!currentQuote) return;
  hide();
  let response;
  try {
    response = await axiosInstance.post("/quotes/rating", {
      quoteId: currentQuote?.id,
      rating: rating,
      language: currentQuote?.language,
    });
  } catch (error) {
    const e = error as AxiosError;
    Loader.hide();
    const msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to submit quote rating: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    let quoteRatings: QuoteRatings = DB.getSnapshot().quoteRatings;
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
      if (quoteRatings === undefined) quoteRatings = {};
      if (quoteRatings[currentQuote.language] === undefined)
        quoteRatings[currentQuote.language] = {};
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
    quoteStats.average =
      Math.round((quoteStats.totalRating / quoteStats.ratings) * 10) / 10;
    $(".pageTest #result #rateQuoteButton .rating").text(
      quoteStats.average?.toFixed(1)
    );
    $(".pageTest #result #rateQuoteButton .icon").removeClass("far");
    $(".pageTest #result #rateQuoteButton .icon").addClass("fas");
  }
}

$("#quoteRatePopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "quoteRatePopupWrapper") {
    hide();
  }
});

$("#quoteRatePopup .stars .star").hover((e) => {
  const ratingHover = parseInt($(e.currentTarget).attr("rating") as string);
  refreshStars(ratingHover);
});

$("#quoteRatePopup .stars .star").click((e) => {
  const ratingHover = parseInt($(e.currentTarget).attr("rating") as string);
  rating = ratingHover;
});

$("#quoteRatePopup .stars .star").mouseout(() => {
  $(`#quoteRatePopup .star`).removeClass("active");
  refreshStars();
});

$("#quoteRatePopup .submitButton").click(() => {
  submit();
});

$(".pageTest #rateQuoteButton").click(async () => {
  show(TestWords.randomQuote);
});
