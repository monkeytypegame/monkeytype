import * as CustomWordAmountPopup from "./custom-word-amount-popup";
import * as CustomTestDurationPopup from "./custom-test-duration-popup";
import * as UpdateConfig from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as TestLogic from "./test-logic";
import * as QuoteSearchPopup from "./quote-search-popup";
import * as CustomTextPopup from "./custom-text-popup";

// export function show() {
//   $("#top .config").removeClass("hidden").css("opacity", 1);
// }

// export function hide() {
//   $("#top .config").css("opacity", 0).addClass("hidden");
// }

export function show() {
  $("#top .config")
    .stop(true, true)
    .removeClass("hidden")
    .css("opacity", 0)
    .animate(
      {
        opacity: 1,
      },
      125
    );
}

export function hide() {
  $("#top .config")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#top .config").addClass("hidden");
      }
    );
}

$(document).on("click", "#top .config .wordCount .text-button", (e) => {
  const wrd = $(e.currentTarget).attr("wordCount");
  if (wrd == "custom") {
    CustomWordAmountPopup.show();
  } else {
    UpdateConfig.setWordCount(wrd);
    ManualRestart.set();
    TestLogic.restart();
  }
});

$(document).on("click", "#top .config .time .text-button", (e) => {
  let mode = $(e.currentTarget).attr("timeConfig");
  if (mode == "custom") {
    CustomTestDurationPopup.show();
  } else {
    UpdateConfig.setTimeConfig(mode);
    ManualRestart.set();
    TestLogic.restart();
  }
});

$(document).on("click", "#top .config .quoteLength .text-button", (e) => {
  let len = $(e.currentTarget).attr("quoteLength");
  if (len == -2) {
    // UpdateConfig.setQuoteLength(-2, false, e.shiftKey);
    QuoteSearchPopup.show();
  } else {
    if (len == -1) {
      len = [0, 1, 2, 3];
    }
    UpdateConfig.setQuoteLength(len, false, e.shiftKey);
    ManualRestart.set();
    TestLogic.restart();
  }
});

$(document).on("click", "#top .config .customText .text-button", () => {
  CustomTextPopup.show();
});

$(document).on("click", "#top .config .punctuationMode .text-button", () => {
  UpdateConfig.togglePunctuation();
  ManualRestart.set();
  TestLogic.restart();
});

$(document).on("click", "#top .config .numbersMode .text-button", () => {
  UpdateConfig.toggleNumbers();
  ManualRestart.set();
  TestLogic.restart();
});

$(document).on("click", "#top .config .mode .text-button", (e) => {
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = $(e.currentTarget).attr("mode");
  UpdateConfig.setMode(mode);
  ManualRestart.set();
  TestLogic.restart();
});
