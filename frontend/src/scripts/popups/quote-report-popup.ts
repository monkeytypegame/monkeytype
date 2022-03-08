import Ape from "../ape";
import Config from "../config";
import * as TestWords from "../test/test-words";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as Misc from "../misc";

const CAPTCHA_ID = 1;

type State = {
  previousPopupShowCallback?: () => void;
  quoteToReport?: MonkeyTypes.Quote;
};

type Options = {
  quoteId: number;
  previousPopupShowCallback?: () => void;
  noAnim: boolean;
};

const state: State = {
  previousPopupShowCallback: undefined,
  quoteToReport: undefined,
};

const defaultOptions: Options = {
  quoteId: -1,
  previousPopupShowCallback: (): void => {
    //
  },
  noAnim: false,
};

export async function show(options = defaultOptions): Promise<void> {
  if ($("#quoteReportPopupWrapper").hasClass("hidden")) {
    const { quoteId, previousPopupShowCallback, noAnim } = options;

    state.previousPopupShowCallback = previousPopupShowCallback;

    const { quotes } = await Misc.getQuotes(Config.language);
    state.quoteToReport = quotes.find((quote) => {
      return quote.id === quoteId;
    });

    $("#quoteReportPopup .quote").text(state.quoteToReport?.text as string);
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
      .animate({ opacity: 1 }, noAnim ? 0 : 100, () => {
        $("#quoteReportPopup textarea").trigger("focus").select();
      });
  }
}

export async function hide(): Promise<void> {
  if (!$("#quoteReportPopupWrapper").hasClass("hidden")) {
    const noAnim = state.previousPopupShowCallback ? true : false;

    $("#quoteReportPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 100,
        () => {
          grecaptcha.reset(CAPTCHA_ID);
          $("#quoteReportPopupWrapper").addClass("hidden");
          if (state.previousPopupShowCallback) {
            state.previousPopupShowCallback();
          }
        }
      );
  }
}

async function submitReport(): Promise<void> {
  const captchaResponse = grecaptcha.getResponse(CAPTCHA_ID);
  if (!captchaResponse) {
    return Notifications.add("Please complete the captcha.");
  }

  const quoteId = state.quoteToReport?.id.toString();
  const quoteLanguage = Config.language;
  const reason = $("#quoteReportPopup .reason").val() as string;
  const comment = $("#quoteReportPopup .comment").val() as string;
  const captcha = captchaResponse as string;

  if (!quoteId) {
    return Notifications.add("Please select a quote.");
  }

  if (!reason) {
    return Notifications.add("Please select a valid report reason.");
  }

  const characterDifference = comment.length - 250;
  if (characterDifference > 0) {
    return Notifications.add(
      `Report comment is ${characterDifference} character(s) too long.`
    );
  }

  Loader.show();
  const response = await Ape.quotes.report(
    quoteId,
    quoteLanguage,
    reason,
    comment,
    captcha
  );
  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add("Failed to report quote: " + response.message, -1);
  }

  Notifications.add("Report submitted. Thank you!", 1);
  hide();
}

$("#quoteReportPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteReportPopupWrapper") {
    hide();
  }
});

$("#quoteReportPopup .comment").on("input", () => {
  setTimeout(() => {
    const len = ($("#quoteReportPopup .comment").val() as string).length;
    $("#quoteReportPopup .characterCount").text(len);
    if (len > 250) {
      $("#quoteReportPopup .characterCount").addClass("red");
    } else {
      $("#quoteReportPopup .characterCount").removeClass("red");
    }
  }, 1);
});

$("#quoteReportPopup .submit").on("click", async () => {
  await submitReport();
});

$(".pageTest #reportQuoteButton").on("click", async () => {
  show({
    quoteId: TestWords.randomQuote?.id,
    noAnim: false,
  });
});
