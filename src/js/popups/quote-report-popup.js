import * as Misc from "./misc";
import axiosInstance from "./axios-instance";
import Config from "./config";
import * as QuoteSearchPopup from "./quote-search-popup";

export async function show(noAnim = false) {
  if ($("#quoteReportPopupWrapper").hasClass("hidden")) {
    const { quotes } = await Misc.getQuotes(Config.language);

    const quoteBeingReported = quotes.find((quote) => {
      return quote.id === QuoteSearchPopup.quoteIdSelectedForReport;
    });

    $("#quoteBeingReported").text(quoteBeingReported.text);
    $("#quoteReportReason").text("");
    $("#quoteReportPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 100, (e) => {
        $("#quoteReportPopup textarea").focus().select();
      });
  }
}

export async function hide() {
  if (!$("#quoteReportPopupWrapper").hasClass("hidden")) {
    $("#quoteReportPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#quoteReportPopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#quoteReportPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteReportPopupWrapper") {
    hide();
    QuoteSearchPopup.show(false);
  }
});

$("#reportQuoteReason").on("input", (e) => {
  setTimeout(() => {
    const len = $("#reportQuoteReason").val().length;
    $("#quoteReportPopup .characterCount").text(len);
    if (len > 250) {
      $("#quoteReportPopup .characterCount").addClass("red");
    } else {
      $("#quoteReportPopup .characterCount").removeClass("red");
    }
  }, 1);
});
