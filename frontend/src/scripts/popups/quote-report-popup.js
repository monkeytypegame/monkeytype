import * as Misc from "../misc";
import * as Notifications from "../elements/notifications";
import axiosInstance from "../axios-instance";
import Config from "../config";
import * as Loader from "../elements/loader";
import * as TestWords from "../test/test-words";

const CAPTCHA_ID = 1;

const state = {
  previousPopupShowCallback: undefined,
  quoteToReport: undefined,
};

const defaultOptions = {
  quoteId: -1,
  previousPopupShowCallback: () => {},
  noAnim: false,
};

export async function show(options = defaultOptions) {
  if ($("#quoteReportPopupWrapper").hasClass("hidden")) {
    const { quoteId, previousPopupShowCallback, noAnim } = options;

    state.previousPopupShowCallback = previousPopupShowCallback;

    const { quotes } = await Misc.getQuotes(Config.language);
    state.quoteToReport = quotes.find((quote) => {
      return quote.id === quoteId;
    });

    $("#quoteReportPopup .quote").text(state.quoteToReport.text);
    $("#quoteReportPopup .reason").val("Grammatical error");
    $("#quoteReportPopup .comment").val("");
    $("#quoteReportPopup .characterCount").text("-");
    $("#quoteReportPopup .reason").select2({
      minimumResultsForSearch: Infinity,
    });
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
    let noAnim = state.previousPopupShowCallback ? true : false;

    $("#quoteReportPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 100,
        (e) => {
          grecaptcha.reset(CAPTCHA_ID);
          $("#quoteReportPopupWrapper").addClass("hidden");
          if (state.previousPopupShowCallback) {
            state.previousPopupShowCallback();
          }
        }
      );
  }
}

async function submitReport() {
  const captchaResponse = grecaptcha.getResponse(CAPTCHA_ID);
  if (!captchaResponse) {
    Notifications.add("Please complete the captcha.");
    return;
  }

  const requestBody = {
    quoteId: state.quoteToReport.id.toString(),
    quoteLanguage: Config.language,
    reason: $("#quoteReportPopup .reason").val(),
    comment: $("#quoteReportPopup .comment").val(),
    captcha: captchaResponse,
  };

  if (!requestBody.reason) {
    Notifications.add("Please select a valid report reason.");
    return;
  }

  const characterDifference = requestBody.comment.length - 250;
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
    hide();
  }
}

$("#quoteReportPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteReportPopupWrapper") {
    hide();
  }
});

$("#quoteReportPopup .comment").on("input", (e) => {
  setTimeout(() => {
    const len = $("#quoteReportPopup .comment").val().length;
    $("#quoteReportPopup .characterCount").text(len);
    if (len > 250) {
      $("#quoteReportPopup .characterCount").addClass("red");
    } else {
      $("#quoteReportPopup .characterCount").removeClass("red");
    }
  }, 1);
});

$("#quoteReportPopup .submit").on("click", async (e) => {
  await submitReport();
});

$(".pageTest #reportQuoteButton").click(async (event) => {
  show({
    quoteId: parseInt(TestWords.randomQuote.id),
    noAnim: false,
  });
});
