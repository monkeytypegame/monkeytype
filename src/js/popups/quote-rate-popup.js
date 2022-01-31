import * as DB from "./db";
import * as Loader from "./loader";
import * as Notifications from "./notifications";
import * as QuoteReportPopup from "./quote-report-popup";
import axiosInstance from "./axios-instance";

let rating = 0;

let currentQuote = null;
let quoteStats = null;

function reset() {
  $(`#quoteRatePopup .quote .text`).text("-");
  $(`#quoteRatePopup .quote .source .val`).text("-");
  $(`#quoteRatePopup .quote .id .val`).text("-");
  $(`#quoteRatePopup .quote .length .val`).text("-");
  $("#quoteRatePopup .ratingCount .val").text("-");
  $("#quoteRatePopup .ratingAverage .val").text("-");
}

export async function getQuoteStats(quote) {
  if (quote) currentQuote = quote;
  let response;
  try {
    response = await axiosInstance.get("/quotes/rating", {
      params: { quoteId: currentQuote.id, language: currentQuote.language },
    });
  } catch (e) {
    Loader.hide();
    let msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to get quote ratings: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    if (response.data === null) {
      quoteStats = {};
    } else {
      quoteStats = response.data;
      if (quoteStats && !quoteStats.average) {
        quoteStats.average =
          Math.round((quoteStats.totalRating / quoteStats.ratings) * 10) / 10;
      }
    }
    return quoteStats;
  }
}

function refreshStars(force) {
  let limit = force ? parseInt(force) : rating;
  $(`#quoteRatePopup .star`).removeClass("active");
  for (let i = 1; i <= limit; i++) {
    $(`#quoteRatePopup .star[rating=${i}]`).addClass("active");
  }
}

async function updateRatingStats() {
  if (!quoteStats) await getQuoteStats();
  $("#quoteRatePopup .ratingCount .val").text(quoteStats.ratings ?? "0");
  $("#quoteRatePopup .ratingAverage .val").text(
    quoteStats.average?.toFixed(1) ?? "-"
  );
}

function updateData() {
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
  $(`#quoteRatePopup .quote .length .val`).text(lengthDesc);
  updateRatingStats();
}

export function show(quote, shouldReset = true) {
  if ($("#quoteRatePopupWrapper").hasClass("hidden")) {
    if (shouldReset) {
      reset();
    }

    currentQuote = quote;
    rating = 0;
    let alreadyRated = DB.getSnapshot().quoteRatings?.[currentQuote.language]?.[
      currentQuote.id
    ];
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

function hide() {
  if (!$("#quoteRatePopupWrapper").hasClass("hidden")) {
    $("#quoteRatePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#quoteRatePopupWrapper").addClass("hidden");
        }
      );
  }
}

export function clearQuoteStats() {
  quoteStats = undefined;
}

async function submit() {
  if (rating == 0) {
    Notifications.add("Please select a rating");
    return;
  }
  hide();
  let response;
  try {
    response = await axiosInstance.post("/quotes/rating", {
      quoteId: currentQuote.id,
      rating: rating,
      language: currentQuote.language,
    });
  } catch (e) {
    Loader.hide();
    let msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to submit quote rating: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    let quoteRatings = DB.getSnapshot().quoteRatings;
    if (quoteRatings?.[currentQuote.language]?.[currentQuote.id]) {
      let oldRating = quoteRatings[currentQuote.language][currentQuote.id];
      let diff = rating - oldRating;
      quoteRatings[currentQuote.language][currentQuote.id] = rating;
      quoteStats = {
        ratings: quoteStats.ratings + 1,
        totalRating: isNaN(quoteStats.totalRating)
          ? 0
          : quoteStats.totalRating + diff,
        quoteId: currentQuote.id,
        language: currentQuote.language,
      };
      Notifications.add("Rating updated", 1);
    } else {
      if (quoteRatings === undefined) quoteRatings = {};
      if (quoteRatings[currentQuote.language] === undefined)
        quoteRatings[currentQuote.language] = {};
      quoteRatings[currentQuote.language][currentQuote.id] = rating;
      if (quoteStats.ratings && quoteStats.totalRating) {
        quoteStats.ratings++;
        quoteStats.totalRating += rating;
      } else {
        quoteStats = {
          ratings: 1,
          totalRating: rating,
          quoteId: currentQuote.id,
          language: currentQuote.language,
        };
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
  let ratingHover = $(e.currentTarget).attr("rating");
  refreshStars(ratingHover);
});

$("#quoteRatePopup .stars .star").click((e) => {
  let ratingHover = $(e.currentTarget).attr("rating");
  rating = parseInt(ratingHover);
});

$("#quoteRatePopup .stars .star").mouseout((e) => {
  $(`#quoteRatePopup .star`).removeClass("active");
  refreshStars();
});

$("#quoteRatePopup .submitButton").click((e) => {
  submit();
});
