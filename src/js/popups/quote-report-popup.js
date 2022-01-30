import * as Misc from "./misc";
import * as Notifications from "./notifications";
import axiosInstance from "./axios-instance";
import Config from "./config";
import * as Loader from "./loader";

const state = {
  previousPopupShowCallback: undefined,
  quoteToReport: undefined,
};

export async function show(quoteId, noAnim = false, previousPopup) {
  if ($("#quoteReportPopupWrapper").hasClass("hidden")) {
    state.previousPopupShowCallback = previousPopup;

    const { quotes } = await Misc.getQuotes(Config.language);
    state.quoteToReport = quotes.find((quote) => {
      return quote.id === quoteId;
    });

    $("#quoteBeingReported").text(state.quoteToReport.text);
    $("#quoteReportComment").text("");
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

async function submitReport() {
  const requestBody = {
    quoteId: state.quoteToReport.id.toString(),
    quoteLanguage: Config.language,
    reason: $("#reportQuoteReason").val(),
    comment: $("#reportQuoteComment").val(),
  };

  if (!requestBody.reason) {
    Notifications.add("Please select a valid report reason.");
    return;
  }

  const characterDifference = requestBody.comment.length > 250;
  if (characterDifference > 0) {
    Notifications.add(
      `Report comment is ${characterDifference} character(s) too long.`
    );
    return;
  }

  Loader.show();

  let response;
  try {
    response = await axiosInstance.post("/quotes/report", requestBody);
  } catch (e) {
    Loader.hide();
    let msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to report quote: " + msg, -1);
    return;
  }

  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    Notifications.add("Report submitted. Thank you!", 1);
  }
}

$("#quoteReportPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteReportPopupWrapper") {
    hide();
    if (state.previousPopupShowCallback) {
      state.previousPopupShowCallback(false);
    }
  }
});

$("#reportQuoteComment").on("input", (e) => {
  setTimeout(() => {
    const len = $("#reportQuoteComment").val().length;
    $("#quoteReportPopup .characterCount").text(len);
    if (len > 250) {
      $("#quoteReportPopup .characterCount").addClass("red");
    } else {
      $("#quoteReportPopup .characterCount").removeClass("red");
    }
  }, 1);
});

$("#submitQuoteReportButton").on("click", async (e) => {
  await submitReport();
});
