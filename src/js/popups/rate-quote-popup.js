import * as DB from "./db";
import * as Loader from "./loader";
import * as Notifications from "./notifications";
import axiosInstance from "./axios-instance";

let rating = 0;

let currentQuote = null;
let quoteStats = null;

function reset() {
  $(`#rateQuotePopup .quote .text`).text("-");
  $(`#rateQuotePopup .quote .source .val`).text("-");
  $(`#rateQuotePopup .quote .id .val`).text("-");
  $(`#rateQuotePopup .quote .length .val`).text("-");
  $("#rateQuotePopup .ratingCount .val").text("-");
  $("#rateQuotePopup .ratingAverage .val").text("-");
}

export async function getQuoteStats(quote) {
  if (quote) currentQuote = quote;
  let response;
  try {
    response = await axiosInstance.get("/quote-ratings/get", {
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
    quoteStats = response.data;
    if (quoteStats && !quoteStats.average) {
      quoteStats.average = (
        Math.round((quoteStats.totalRating / quoteStats.ratings) * 10) / 10
      ).toFixed(1);
    }
    return response.data;
  }
}

function refreshStars(force) {
  let limit = force ? parseInt(force) : rating;
  $(`#rateQuotePopup .star`).removeClass("active");
  for (let i = 1; i <= limit; i++) {
    $(`#rateQuotePopup .star[rating=${i}]`).addClass("active");
  }
}

async function updateRatingStats() {
  if (quoteStats === null) await getQuoteStats();
  if (quoteStats === undefined) {
    $("#rateQuotePopup .ratingCount .val").text("0");
    $("#rateQuotePopup .ratingAverage .val").text("-");
  } else {
    $("#rateQuotePopup .ratingCount .val").text(quoteStats.ratings);
    $("#rateQuotePopup .ratingAverage .val").text(quoteStats.average);
  }
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
  $(`#rateQuotePopup .quote .text`).text(currentQuote.text);
  $(`#rateQuotePopup .quote .source .val`).text(currentQuote.source);
  $(`#rateQuotePopup .quote .id .val`).text(currentQuote.id);
  $(`#rateQuotePopup .quote .length .val`).text(lengthDesc);
  updateRatingStats();
}

export function show(quote) {
  if ($("#rateQuotePopupWrapper").hasClass("hidden")) {
    reset();

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
    $("#rateQuotePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hide() {
  if (!$("#rateQuotePopupWrapper").hasClass("hidden")) {
    $("#rateQuotePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#rateQuotePopupWrapper").addClass("hidden");
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
    response = await axiosInstance.post("/quote-ratings/submit", {
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
      quoteStats.totalRating += diff;

      quoteRatings[currentQuote.language][currentQuote.id] = rating;
      Notifications.add("Rating updated", 1);
    } else {
      if (quoteRatings === undefined) quoteRatings = {};
      if (quoteRatings[currentQuote.language] === undefined)
        quoteRatings[currentQuote.language] = {};
      if (quoteRatings[currentQuote.language][currentQuote.id] == undefined)
        quoteRatings[currentQuote.language][currentQuote.id] = undefined;
      quoteRatings[currentQuote.language][currentQuote.id] = rating;
      if (quoteStats) {
        quoteStats.ratings++;
        quoteStats.totalRating += parseInt(rating);
      } else {
        quoteStats = {
          ratings: 1,
          totalRating: parseInt(rating),
          quoteId: currentQuote.id,
          language: currentQuote.language,
        };
      }
      Notifications.add("Rating submitted", 1);
    }
    quoteStats.average = (
      Math.round((quoteStats.totalRating / quoteStats.ratings) * 10) / 10
    ).toFixed(1);
    $(".pageTest #result #rateQuoteButton .rating").text(quoteStats.average);
    $(".pageTest #result #rateQuoteButton .icon").removeClass("far");
    $(".pageTest #result #rateQuoteButton .icon").addClass("fas");
  }
}

$("#rateQuotePopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "rateQuotePopupWrapper") {
    hide();
  }
});

$("#rateQuotePopup .stars .star").hover((e) => {
  let ratingHover = $(e.currentTarget).attr("rating");
  refreshStars(ratingHover);
});

$("#rateQuotePopup .stars .star").click((e) => {
  let ratingHover = $(e.currentTarget).attr("rating");
  rating = ratingHover;
});

$("#rateQuotePopup .stars .star").mouseout((e) => {
  $(`#rateQuotePopup .star`).removeClass("active");
  refreshStars();
});

$("#rateQuotePopup .submitButton").click((e) => {
  submit();
});
