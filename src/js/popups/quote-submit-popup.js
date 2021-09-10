import * as Misc from "./misc";
import * as Notifications from "./notifications";
import Config from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as TestLogic from "./test-logic";
import axiosInstance from "./axios-instance";

export let selectedId = 1;

async function submitQuote() {
  let data = {
    text: $("#submitQuoteText").val(),
    source: $("#submitQuoteSource").val(),
    language: $("#submitQuoteLanguage").val(),
  };
  let response = await axiosInstance.post("/new-quotes/add", data);
  $("#submitQuoteText").val("");
  $("#submitQuoteSource").val("");
  $("#submitQuoteLanguage").val("");
  Notifications.add("Quote added successfully", 1, 10);
}

export async function show() {
  if ($("#quoteSubmitPopupWrapper").hasClass("hidden")) {
    $("#quoteSubmitPopup input").val("");
    $("#quoteSubmitPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
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

$("#quoteSubmitPopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "quoteSubmitPopupWrapper") {
    hide();
  }
});

$(document).on("click", "#submitQuoteButton", (e) => {
  submitQuote();
});
