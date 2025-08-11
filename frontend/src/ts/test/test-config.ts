import { ConfigValue, QuoteLength } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import { applyReducedMotion } from "../utils/misc";
import { areUnsortedArraysEqual } from "../utils/arrays";
import * as AuthEvent from "../observables/auth-event";

export function show(): void {
  $("#testConfig").removeClass("invisible");
  $("#mobileTestConfigButton").removeClass("invisible");
}

export function hide(): void {
  $("#testConfig").addClass("invisible");
  $("#mobileTestConfigButton").addClass("invisible");
}

export async function instantUpdate(): Promise<void> {
  $("#testConfig .mode .textButton").removeClass("active");
  $("#testConfig .mode .textButton[mode='" + Config.mode + "']").addClass(
    "active"
  );

  $("#testConfig .puncAndNum").addClass("hidden");
  $("#testConfig .spacer").css("transition", "none").addClass("scrolled");
  $("#testConfig .time").addClass("hidden");
  $("#testConfig .wordCount").addClass("hidden");
  $("#testConfig .customText").addClass("hidden");
  $("#testConfig .quoteLength").addClass("hidden");
  $("#testConfig .zen").addClass("hidden");

  if (Config.mode === "time") {
    $("#testConfig .puncAndNum").removeClass("hidden").css({
      width: "",
      opacity: "",
    });
    $("#testConfig .leftSpacer").removeClass("scrolled");
    $("#testConfig .rightSpacer").removeClass("scrolled");
    $("#testConfig .time").removeClass("hidden");

    updateActiveExtraButtons("time", Config.time);
  } else if (Config.mode === "words") {
    $("#testConfig .puncAndNum").removeClass("hidden").css({
      width: "",
      opacity: "",
    });
    $("#testConfig .leftSpacer").removeClass("scrolled");
    $("#testConfig .rightSpacer").removeClass("scrolled");
    $("#testConfig .wordCount").removeClass("hidden");

    updateActiveExtraButtons("words", Config.words);
  } else if (Config.mode === "quote") {
    $("#testConfig .rightSpacer").removeClass("scrolled");
    $("#testConfig .quoteLength").removeClass("hidden");

    updateActiveExtraButtons("quoteLength", Config.quoteLength);
  } else if (Config.mode === "custom") {
    $("#testConfig .puncAndNum").removeClass("hidden").css({
      width: "",
      opacity: "",
    });
    $("#testConfig .leftSpacer").removeClass("scrolled");
    $("#testConfig .rightSpacer").removeClass("scrolled");
    $("#testConfig .customText").removeClass("hidden");
  }

  updateActiveExtraButtons("quoteLength", Config.quoteLength);
  updateActiveExtraButtons("numbers", Config.numbers);
  updateActiveExtraButtons("punctuation", Config.punctuation);

  setTimeout(() => {
    $("#testConfig .spacer").css("transition", "");
  }, 125);
}

async function update(previous: Mode, current: Mode): Promise<void> {
  if (previous === current) return;
  updateActiveModeButtons(current);

  let m2;

  if (Config.mode === "time") {
    m2 = Config.time;
  } else if (Config.mode === "words") {
    m2 = Config.words;
  } else if (Config.mode === "quote") {
    m2 = Config.quoteLength;
  }

  if (m2 !== undefined) updateActiveExtraButtons(Config.mode, m2);

  const submenu = {
    time: "time",
    words: "wordCount",
    custom: "customText",
    quote: "quoteLength",
    zen: "zen",
  };

  const animTime = applyReducedMotion(250);
  const easing = {
    both: "easeInOutSine",
    in: "easeInSine",
    out: "easeOutSine",
  };

  const puncAndNumVisible = {
    time: true,
    words: true,
    custom: true,
    quote: false,
    zen: false,
  };

  const puncAndNumEl = $("#testConfig .puncAndNum");

  if (puncAndNumVisible[current] !== puncAndNumVisible[previous]) {
    if (!puncAndNumVisible[current]) {
      $("#testConfig .leftSpacer").addClass("scrolled");
    } else {
      $("#testConfig .leftSpacer").removeClass("scrolled");
    }

    puncAndNumEl
      .css({
        width: "unset",
        opacity: 1,
      })
      .removeClass("hidden");

    const width = Math.round(
      puncAndNumEl[0]?.getBoundingClientRect().width ?? 0
    );

    puncAndNumEl
      .stop(true, false)
      .css({
        width: puncAndNumVisible[previous] ? width : 0,
        opacity: puncAndNumVisible[previous] ? 1 : 0,
      })
      .animate(
        {
          width: puncAndNumVisible[current] ? width : 0,
          opacity: puncAndNumVisible[current] ? 1 : 0,
        },
        animTime,
        easing.both,
        () => {
          if (puncAndNumVisible[current]) {
            puncAndNumEl.css("width", "unset");
          } else {
            puncAndNumEl.addClass("hidden");
          }
        }
      );
  }

  if (current === "zen") {
    $("#testConfig .rightSpacer").addClass("scrolled");
  } else {
    $("#testConfig .rightSpacer").removeClass("scrolled");
  }

  const currentEl = $(`#testConfig .${submenu[current]}`);
  const previousEl = $(`#testConfig .${submenu[previous]}`);

  const previousWidth = Math.round(
    previousEl[0]?.getBoundingClientRect().width ?? 0
  );

  previousEl.addClass("hidden");

  currentEl.removeClass("hidden");

  const currentWidth = Math.round(
    currentEl[0]?.getBoundingClientRect().width ?? 0
  );

  previousEl.removeClass("hidden");

  currentEl.addClass("hidden");

  const widthDifference = currentWidth - previousWidth;

  const widthStep = widthDifference / 2;

  previousEl
    .stop(true, false)
    .css({
      opacity: 1,
      width: previousWidth,
    })
    .animate(
      {
        width: previousWidth + widthStep,
        opacity: 0,
      },
      animTime / 2,
      easing.in,
      () => {
        previousEl
          .css({
            opacity: 1,
            width: "unset",
          })
          .addClass("hidden");
        currentEl
          .css({
            opacity: 0,
            width: previousWidth + widthStep,
          })
          .removeClass("hidden")
          .stop(true, false)
          .animate(
            {
              opacity: 1,
              width: currentWidth,
            },
            animTime / 2,
            easing.out,
            () => {
              currentEl.css("width", "unset");
            }
          );
      }
    );
}

function updateActiveModeButtons(mode: Mode): void {
  $("#testConfig .mode .textButton").removeClass("active");
  $("#testConfig .mode .textButton[mode='" + mode + "']").addClass("active");
}

function updateActiveExtraButtons(key: string, value: ConfigValue): void {
  if (key === "time") {
    $("#testConfig .time .textButton").removeClass("active");
    const timeCustom = ![15, 30, 60, 120].includes(value as number)
      ? "custom"
      : value;
    $(
      "#testConfig .time .textButton[timeConfig='" + timeCustom + "']"
    ).addClass("active");
  } else if (key === "words") {
    $("#testConfig .wordCount .textButton").removeClass("active");

    const wordCustom = ![10, 25, 50, 100, 200].includes(value as number)
      ? "custom"
      : value;

    $(
      "#testConfig .wordCount .textButton[wordCount='" + wordCustom + "']"
    ).addClass("active");
  } else if (key === "quoteLength") {
    $("#testConfig .quoteLength .textButton").removeClass("active");

    if (areUnsortedArraysEqual(value as QuoteLength[], [0, 1, 2, 3])) {
      $("#testConfig .quoteLength .textButton[quotelength='all']").addClass(
        "active"
      );
    } else {
      (value as QuoteLength[]).forEach((ql) => {
        $(
          "#testConfig .quoteLength .textButton[quoteLength='" + ql + "']"
        ).addClass("active");
      });
    }
  } else if (key === "numbers") {
    if (value === false) {
      $("#testConfig .numbersMode.textButton").removeClass("active");
    } else {
      $("#testConfig .numbersMode.textButton").addClass("active");
    }
  } else if (key === "punctuation") {
    if (value === false) {
      $("#testConfig .punctuationMode.textButton").removeClass("active");
    } else {
      $("#testConfig .punctuationMode.textButton").addClass("active");
    }
  }
}

export function showFavoriteQuoteLength(): void {
  $("#testConfig .quoteLength .favorite").removeClass("hidden");
}

export function hideFavoriteQuoteLength(): void {
  $("#testConfig .quoteLength .favorite").addClass("hidden");
}

let ignoreConfigEvent = false;

ConfigEvent.subscribe((eventKey, eventValue, _nosave, eventPreviousValue) => {
  if (eventKey === "fullConfigChange") {
    ignoreConfigEvent = true;
  }
  if (eventKey === "fullConfigChangeFinished") {
    ignoreConfigEvent = false;

    void instantUpdate();
  }

  // this is here to prevent calling set / preview multiple times during a full config loading
  // once the full config is loaded, we can apply everything once
  if (ignoreConfigEvent) return;

  if (ActivePage.get() !== "test") return;
  if (eventKey === "mode") {
    void update(eventPreviousValue as Mode, eventValue as Mode);
  } else if (
    ["time", "quoteLength", "words", "numbers", "punctuation"].includes(
      eventKey
    )
  ) {
    if (eventValue !== undefined)
      updateActiveExtraButtons(eventKey, eventValue);
  }
});

AuthEvent.subscribe((event) => {
  if (event.type === "snapshotUpdated" && event.data.isInitial) {
    showFavoriteQuoteLength();
  }
  if (event.type === "authStateChanged" && !event.data.isUserSignedIn) {
    hideFavoriteQuoteLength();
  }
});
