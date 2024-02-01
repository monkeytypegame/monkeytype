import * as TestLogic from "../test/test-logic";
import Config, * as UpdateConfig from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomWordAmountPopup from "./custom-word-amount-popup";
import * as CustomTestDurationPopup from "./custom-test-duration-popup";
import * as QuoteSearchPopup from "./quote-search-popup";
import * as CustomTextPopup from "./custom-text-popup";
import * as ConfigEvent from "../observables/config-event";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "mobileTestConfigPopupWrapper";

const el = $("#mobileTestConfigPopup");

function update(): void {
  el.find("button").removeClass("active");

  el.find(`.modeGroup button[data-mode='${Config.mode}']`).addClass("active");
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
    el.find(`.timeGroup button[data-time='${Config.time}']`).addClass("active");
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  } else if (Config.mode === "words") {
    el.find(`.wordsGroup button[data-words='${Config.words}']`).addClass(
      "active"
    );
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  } else if (Config.mode === "quote") {
    for (const ql of Config.quoteLength) {
      el.find(`.quoteGroup button[data-quoteLength='${ql}']`).addClass(
        "active"
      );
    }
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
  Skeleton.append(wrapperId);

  if (!isPopupVisible(wrapperId)) {
    update();
    $("#mobileTestConfigPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hidePopup(): void {
  if (isPopupVisible(wrapperId)) {
    $("#mobileTestConfigPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#mobileTestConfigPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

$("#mobileTestConfigPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "mobileTestConfigPopupWrapper") {
    hidePopup();
  }
});

$("#mobileTestConfig").on("click", () => {
  showPopup();
});

el.find(".wordsGroup button").on("click", (e) => {
  const wrd = $(e.currentTarget).attr("data-words");

  if (wrd === "custom") {
    hidePopup();
    CustomWordAmountPopup.show();
  } else if (wrd !== undefined) {
    const wrdNum = parseInt(wrd);
    UpdateConfig.setWordCount(wrdNum);
    ManualRestart.set();
    TestLogic.restart();
  }
});

el.find(".timeGroup button").on("click", (e) => {
  const time = $(e.currentTarget).attr("data-time");

  if (time === "custom") {
    hidePopup();
    CustomTestDurationPopup.show();
  } else if (time !== undefined) {
    const timeNum = parseInt(time);
    UpdateConfig.setTimeConfig(timeNum);
    ManualRestart.set();
    TestLogic.restart();
  }
});

el.find(".quoteGroup button").on("click", (e) => {
  let len: number | number[] = parseInt(
    $(e.currentTarget).attr("data-quoteLength") ?? "0",
    10
  );
  if (len === -2) {
    // UpdateConfig.setQuoteLength(-2, false, e.shiftKey);
    hidePopup();
    QuoteSearchPopup.show();
  } else {
    if (len === -1) {
      len = [0, 1, 2, 3];
    }
    UpdateConfig.setQuoteLength(
      len as MonkeyTypes.QuoteLength | MonkeyTypes.QuoteLength[],
      false,
      e.shiftKey
    );
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

el.find(".modeGroup button").on("click", (e) => {
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = $(e.currentTarget).attr("data-mode");
  UpdateConfig.setMode(mode as SharedTypes.Mode);
  ManualRestart.set();
  TestLogic.restart();
});

$("#mobileTestConfigPopupWrapper button").on("click", () => {
  // hidePopup();
  update();
});

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "mode") update();
});

Skeleton.save(wrapperId);
