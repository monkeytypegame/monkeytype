import * as Misc from "./misc";
import * as Notifications from "./notifications";
import axiosInstance from "./axios-instance";

let dropdownReady = false;
async function initDropdown() {
  if (dropdownReady) return;
  let languages = await Misc.getLanguageList();
  languages.forEach((language) => {
    if (!/_\d*k$/g.test(language)) {
      $("#quoteSubmitPopup #submitQuoteLanguage").append(
        `<option value="${language}">${language.replace(/_/g, " ")}</option>`
      );
    }
  });
  $("#quoteSubmitPopup #submitQuoteLanguage").select2();
  dropdownReady = true;
}

async function submitQuote() {
  let data = {
    text: $("#quoteSubmitPopup #submitQuoteText").val(),
    source: $("#quoteSubmitPopup #submitQuoteSource").val(),
    language: $("#quoteSubmitPopup #submitQuoteLanguage").val(),
  };
  let response = await axiosInstance.post("/new-quotes/add", data);
  if (response.data.similarityScore) {
    Notifications.add(
      `Likely duplicate of quote with id ${
        response.data.duplicateId
      }.\n Confidence: ${response.data.similarityScore * 100}%`,
      -1,
      10
    );
  } else if (response.data.languageError) {
    Notifications.add("Language not found", -1);
  } else {
    Notifications.add("Quote added successfully", 1);
    $("#quoteSubmitPopup #submitQuoteText").val("");
    $("#quoteSubmitPopup #submitQuoteSource").val("");
    $("#quoteSubmitPopup #submitQuoteLanguage").val("");
  }
}

export async function show(noAnim = false) {
  if ($("#quoteSubmitPopupWrapper").hasClass("hidden")) {
    initDropdown();
    $("#quoteSubmitPopup input").val("");
    $("#quoteSubmitPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 100, (e) => {
        $("#quoteSubmitPopup textarea").focus().select();
        //updateResults("");
      });
  }
}

export function hide() {
  if (!$("#quoteSubmitPopupWrapper").hasClass("hidden")) {
    $("#quoteSubmitPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#quoteSubmitPopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#quoteSubmitPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteSubmitPopupWrapper") {
    hide();
  }
});

$(document).on("click", "#quoteSubmitPopup #submitQuoteButton", (e) => {
  submitQuote();
});
