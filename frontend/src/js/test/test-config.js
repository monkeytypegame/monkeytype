import Config, * as UpdateConfig from "../config";
import * as ManualRestart from "./manual-restart-tracker";
import * as TestLogic from "./test-logic";
import * as QuoteSearchPopup from "../popups/quote-search-popup";
import * as CustomTextPopup from "../popups/custom-text-popup";
import * as Misc from "./../misc";

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

export function update(previous, current) {
  if (previous == current) return;
  $("#top .config .mode .text-button").removeClass("active");
  $("#top .config .mode .text-button[mode='" + current + "']").addClass(
    "active"
  );
  if (current == "time") {
    // $("#top .config .wordCount").addClass("hidden");
    // $("#top .config .time").removeClass("hidden");
    // $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    // $("#top .config .puncAndNum").removeClass("disabled");
    // $("#top .config .punctuationMode").removeClass("hidden");
    // $("#top .config .numbersMode").removeClass("hidden");
    // $("#top .config .quoteLength").addClass("hidden");
  } else if (current == "words") {
    // $("#top .config .wordCount").removeClass("hidden");
    // $("#top .config .time").addClass("hidden");
    // $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    // $("#top .config .puncAndNum").removeClass("disabled");
    // $("#top .config .punctuationMode").removeClass("hidden");
    // $("#top .config .numbersMode").removeClass("hidden");
    // $("#top .config .quoteLength").addClass("hidden");
  } else if (current == "custom") {
    // $("#top .config .wordCount").addClass("hidden");
    // $("#top .config .time").addClass("hidden");
    // $("#top .config .customText").removeClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    // $("#top .config .puncAndNum").removeClass("disabled");
    // $("#top .config .punctuationMode").removeClass("hidden");
    // $("#top .config .numbersMode").removeClass("hidden");
    // $("#top .config .quoteLength").addClass("hidden");
  } else if (current == "quote") {
    // $("#top .config .wordCount").addClass("hidden");
    // $("#top .config .time").addClass("hidden");
    // $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").addClass("disabled");
    $("#top .config .numbersMode").addClass("disabled");
    // $("#top .config .puncAndNum").addClass("disabled");
    // $("#top .config .punctuationMode").removeClass("hidden");
    // $("#top .config .numbersMode").removeClass("hidden");
    // $("#result .stats .source").removeClass("hidden");
    // $("#top .config .quoteLength").removeClass("hidden");
  } else if (current == "zen") {
    // $("#top .config .wordCount").addClass("hidden");
    // $("#top .config .time").addClass("hidden");
    // $("#top .config .customText").addClass("hidden");
    // $("#top .config .punctuationMode").addClass("hidden");
    // $("#top .config .numbersMode").addClass("hidden");
    // $("#top .config .quoteLength").addClass("hidden");
  }

  let submenu = {
    time: "time",
    words: "wordCount",
    custom: "customText",
    quote: "quoteLength",
    zen: "",
  };

  let animTime = 250;

  if (current == "zen") {
    $(`#top .config .${submenu[previous]}`).animate(
      {
        opacity: 0,
      },
      animTime / 2,
      () => {
        $(`#top .config .${submenu[previous]}`).addClass("hidden");
      }
    );
    $(`#top .config .puncAndNum`).animate(
      {
        opacity: 0,
      },
      animTime / 2,
      () => {
        $(`#top .config .puncAndNum`).addClass("invisible");
      }
    );
    return;
  }

  if (previous == "zen") {
    setTimeout(() => {
      $(`#top .config .${submenu[current]}`).removeClass("hidden");
      $(`#top .config .${submenu[current]}`)
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          animTime / 2
        );
      $(`#top .config .puncAndNum`).removeClass("invisible");
      $(`#top .config .puncAndNum`)
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          animTime / 2
        );
    }, animTime / 2);
    return;
  }

  Misc.swapElements(
    $("#top .config ." + submenu[previous]),
    $("#top .config ." + submenu[current]),
    animTime
  );
}

$(document).on("click", "#top .config .wordCount .text-button", (e) => {
  const wrd = $(e.currentTarget).attr("wordCount");
  if (wrd != "custom") {
    UpdateConfig.setWordCount(wrd);
    ManualRestart.set();
    TestLogic.restart();
  }
});

$(document).on("click", "#top .config .time .text-button", (e) => {
  let mode = $(e.currentTarget).attr("timeConfig");
  if (mode != "custom") {
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
  UpdateConfig.setPunctuation(!Config.punctuation);
  ManualRestart.set();
  TestLogic.restart();
});

$(document).on("click", "#top .config .numbersMode .text-button", () => {
  UpdateConfig.setNumbers(!Config.numbers);
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

$(document).ready(() => {
  UpdateConfig.subscribeToEvent((eventKey, eventValue, eventValue2) => {
    if (eventKey === "mode") update(eventValue, eventValue2);
  });
});
