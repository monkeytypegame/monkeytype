import { ConfigValue, QuoteLength } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import { applyReducedMotion, promiseAnimate } from "../utils/misc";
import { areUnsortedArraysEqual } from "../utils/arrays";
import * as AuthEvent from "../observables/auth-event";
import { animate } from "animejs";

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
    "active",
  );

  $("#testConfig .puncAndNum").addClass("hidden");
  $("#testConfig .spacer").addClass("hidden");
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
    $("#testConfig .leftSpacer").removeClass("hidden");
    $("#testConfig .rightSpacer").removeClass("hidden");
    $("#testConfig .time").removeClass("hidden");

    updateActiveExtraButtons("time", Config.time);
  } else if (Config.mode === "words") {
    $("#testConfig .puncAndNum").removeClass("hidden").css({
      width: "",
      opacity: "",
    });
    $("#testConfig .leftSpacer").removeClass("hidden");
    $("#testConfig .rightSpacer").removeClass("hidden");
    $("#testConfig .wordCount").removeClass("hidden");

    updateActiveExtraButtons("words", Config.words);
  } else if (Config.mode === "quote") {
    $("#testConfig .rightSpacer").removeClass("hidden");
    $("#testConfig .quoteLength").removeClass("hidden");

    updateActiveExtraButtons("quoteLength", Config.quoteLength);
  } else if (Config.mode === "custom") {
    $("#testConfig .puncAndNum").removeClass("hidden").css({
      width: "",
      opacity: "",
    });
    $("#testConfig .leftSpacer").removeClass("hidden");
    $("#testConfig .rightSpacer").removeClass("hidden");
    $("#testConfig .customText").removeClass("hidden");
  }

  updateActiveExtraButtons("quoteLength", Config.quoteLength);
  updateActiveExtraButtons("numbers", Config.numbers);
  updateActiveExtraButtons("punctuation", Config.punctuation);
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

  const scale = 2;
  const easing = {
    both: `inOut(${scale})`,
    in: `in(${scale})`,
    out: `out(${scale})`,
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
    puncAndNumEl
      .css({
        width: "unset",
        opacity: 1,
      })
      .removeClass("hidden");

    const width = Math.round(
      puncAndNumEl[0]?.getBoundingClientRect().width ?? 0,
    );

    animate(puncAndNumEl[0] as HTMLElement, {
      width: [
        (puncAndNumVisible[previous] ? width : 0) + "px",
        (puncAndNumVisible[current] ? width : 0) + "px",
      ],
      opacity: {
        duration: animTime / 2,
        delay: puncAndNumVisible[current] ? animTime / 2 : 0,
        from: puncAndNumVisible[previous] ? 1 : 0,
        to: puncAndNumVisible[current] ? 1 : 0,
      },
      duration: animTime,
      ease: easing.both,
      onComplete: () => {
        if (puncAndNumVisible[current]) {
          puncAndNumEl.css("width", "unset");
        } else {
          puncAndNumEl.addClass("hidden");
        }
      },
    });

    const leftSpacerEl = document.querySelector(
      "#testConfig .leftSpacer",
    ) as HTMLElement;

    leftSpacerEl.style.width = "0.5em";
    leftSpacerEl.style.opacity = "1";
    leftSpacerEl.classList.remove("hidden");

    animate(leftSpacerEl, {
      width: [
        puncAndNumVisible[previous] ? "0.5em" : 0,
        puncAndNumVisible[current] ? "0.5em" : 0,
      ],
      // opacity: {
      //   duration: animTime / 2,
      //   // delay: puncAndNumVisible[current] ? animTime / 2 : 0,
      //   from: puncAndNumVisible[previous] ? 1 : 0,
      //   to: puncAndNumVisible[current] ? 1 : 0,
      // },
      duration: animTime,
      ease: easing.both,
      onComplete: () => {
        if (puncAndNumVisible[current]) {
          leftSpacerEl.style.width = "";
        } else {
          leftSpacerEl.classList.add("hidden");
        }
      },
    });
  }

  const rightSpacerEl = document.querySelector(
    "#testConfig .rightSpacer",
  ) as HTMLElement;

  rightSpacerEl.style.width = "0.5em";
  rightSpacerEl.style.opacity = "1";
  rightSpacerEl.classList.remove("hidden");

  animate(rightSpacerEl, {
    width: [
      previous === "zen" ? "0px" : "0.5em",
      current === "zen" ? "0px" : "0.5em",
    ],
    // opacity: {
    //   duration: animTime / 2,
    //   from: previous === "zen" ? 0 : 1,
    //   to: current === "zen" ? 0 : 1,
    // },
    duration: animTime,
    ease: easing.both,
    onComplete: () => {
      if (current === "zen") {
        rightSpacerEl.classList.add("hidden");
      } else {
        rightSpacerEl.style.width = "";
      }
    },
  });

  const currentEl = $(`#testConfig .${submenu[current]}`);
  const previousEl = $(`#testConfig .${submenu[previous]}`);

  const previousWidth = Math.round(
    previousEl[0]?.getBoundingClientRect().width ?? 0,
  );

  previousEl.addClass("hidden");
  currentEl.removeClass("hidden");

  const currentWidth = Math.round(
    currentEl[0]?.getBoundingClientRect().width ?? 0,
  );

  previousEl.removeClass("hidden");
  currentEl.addClass("hidden");

  const widthDifference = currentWidth - previousWidth;
  const widthStep = widthDifference / 2;

  await promiseAnimate(previousEl[0] as HTMLElement, {
    opacity: [1, 0],
    width: [previousWidth + "px", previousWidth + widthStep + "px"],
    duration: animTime / 2,
    ease: easing.in,
  });

  previousEl
    .css({
      opacity: 1,
      width: "unset",
    })
    .addClass("hidden");
  currentEl
    .css({
      opacity: 0,
      width: previousWidth + widthStep + "px",
    })
    .removeClass("hidden");

  await promiseAnimate(currentEl[0] as HTMLElement, {
    opacity: [0, 1],
    width: [previousWidth + widthStep + "px", currentWidth + "px"],
    duration: animTime / 2,
    ease: easing.out,
  });
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
      : (value as number);
    $(
      "#testConfig .time .textButton[timeConfig='" + timeCustom + "']",
    ).addClass("active");
  } else if (key === "words") {
    $("#testConfig .wordCount .textButton").removeClass("active");

    const wordCustom = ![10, 25, 50, 100, 200].includes(value as number)
      ? "custom"
      : (value as number);

    $(
      "#testConfig .wordCount .textButton[wordCount='" + wordCustom + "']",
    ).addClass("active");
  } else if (key === "quoteLength") {
    $("#testConfig .quoteLength .textButton").removeClass("active");

    if (areUnsortedArraysEqual(value as QuoteLength[], [0, 1, 2, 3])) {
      $("#testConfig .quoteLength .textButton[quotelength='all']").addClass(
        "active",
      );
    } else {
      (value as QuoteLength[]).forEach((ql) => {
        $(
          "#testConfig .quoteLength .textButton[quoteLength='" + ql + "']",
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
      eventKey,
    )
  ) {
    if (eventValue !== undefined) {
      updateActiveExtraButtons(eventKey, eventValue);
    }
  }
});

AuthEvent.subscribe((event) => {
  if (event.type === "authStateChanged") {
    if (!event.data.isUserSignedIn) {
      hideFavoriteQuoteLength();
    } else {
      showFavoriteQuoteLength();
    }
  }
});
