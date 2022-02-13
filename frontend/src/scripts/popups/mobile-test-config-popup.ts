// @ts-ignore
import * as TestLogic from "../test/test-logic";
// @ts-ignore
import Config from "../config";
// @ts-ignore
import * as UpdateConfig from "../config";
// @ts-ignore
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomWordAmountPopup from "./custom-word-amount-popup";
import * as CustomTestDurationPopup from "./custom-test-duration-popup";
import * as QuoteSearchPopup from "./quote-search-popup";
import * as CustomTextPopup from "./custom-text-popup";
import * as ConfigEvent from "../observables/config-event";

const el = $("#mobileTestConfigPopup");

export function update(): void {
  el.find(".button").removeClass("active");

  el.find(`.modeGroup .button[mode='${Config.mode}']`).addClass("active");
  el.find(".timeGroup").addClass("hidden");
  el.find(".wordsGroup").addClass("hidden");
  el.find(".quoteGroup").addClass("hidden");
  el.find(".customGroup").addClass("hidden");
  el.find(`.${Config.mode}Group`).removeClass("hidden");

  if (Config.punctuation) {
    el.find(".punctuation").addClass("active");
  } else {
    el.find(".punctuation").removeClass("active");
  }

  if (Config.numbers) {
    el.find(".numbers").addClass("active");
  } else {
    el.find(".numbers").removeClass("active");
  }

  if (Config.mode === "time") {
    el.find(`.timeGroup .button[time='${Config.time}']`).addClass("active");
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  } else if (Config.mode === "words") {
    el.find(`.wordsGroup .button[words='${Config.words}']`).addClass("active");
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  } else if (Config.mode === "quote") {
    el.find(`.quoteGroup .button[quote='${Config.quoteLength}']`).addClass(
      "active"
    );
    el.find(".punctuation").addClass("disabled");
    el.find(".numbers").addClass("disabled");
  } else if (Config.mode === "zen") {
    el.find(".punctuation").addClass("disabled");
    el.find(".numbers").addClass("disabled");
  } else if (Config.mode === "custom") {
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  }
}

function showPopup(): void {
  if ($("#mobileTestConfigPopupWrapper").hasClass("hidden")) {
    update();
    $("#mobileTestConfigPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100);
  }
}

function hidePopup(): void {
  if (!$("#mobileTestConfigPopupWrapper").hasClass("hidden")) {
    $("#mobileTestConfigPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#mobileTestConfigPopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#mobileTestConfigPopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "mobileTestConfigPopupWrapper") {
    hidePopup();
  }
});

$("#top .mobileConfig").click(() => {
  showPopup();
});

el.find(".wordsGroup .button").on("click", (e) => {
  const wrd = $(e.currentTarget).attr("words");
  if (wrd == "custom") {
    hidePopup();
    CustomWordAmountPopup.show();
  } else {
    UpdateConfig.setWordCount(wrd);
    ManualRestart.set();
    TestLogic.restart();
  }
});

el.find(".timeGroup .button").on("click", (e) => {
  const mode = $(e.currentTarget).attr("time");
  if (mode == "custom") {
    hidePopup();
    CustomTestDurationPopup.show();
  } else {
    UpdateConfig.setTimeConfig(mode);
    ManualRestart.set();
    TestLogic.restart();
  }
});

el.find(".quoteGroup .button").on("click", (e) => {
  let len: number | number[] = ($(e.currentTarget).attr("quote") ??
    0) as number;
  if (len == -2) {
    // UpdateConfig.setQuoteLength(-2, false, e.shiftKey);
    hidePopup();
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

el.find(".customChange").on("click", () => {
  hidePopup();
  CustomTextPopup.show();
});

el.find(".punctuation").on("click", () => {
  UpdateConfig.setPunctuation(!Config.punctuation);
  ManualRestart.set();
  TestLogic.restart();
});

el.find(".numbers").on("click", () => {
  UpdateConfig.setNumbers(!Config.numbers);
  ManualRestart.set();
  TestLogic.restart();
});

el.find(".modeGroup .button").on("click", (e) => {
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = $(e.currentTarget).attr("mode");
  UpdateConfig.setMode(mode);
  ManualRestart.set();
  TestLogic.restart();
});

$("#mobileTestConfigPopup .button").click(() => {
  // hidePopup();
  update();
});

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "mode") update();
});
