import { ConfigValue, QuoteLength } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import { getActivePage } from "../signals/core";
import { applyReducedMotion } from "../utils/misc";
import { areUnsortedArraysEqual } from "../utils/arrays";
import * as AuthEvent from "../observables/auth-event";
import { qs, qsa } from "../utils/dom";

export function show(): void {
  qs("#testConfig")?.removeClass("invisible");
  qs("#mobileTestConfigButton")?.removeClass("invisible");
}

export function hide(): void {
  qs("#testConfig")?.addClass("invisible");
  qs("#mobileTestConfigButton")?.addClass("invisible");
}

export async function instantUpdate(): Promise<void> {
  qsa("#testConfig .mode .textButton")?.removeClass("active");
  qs("#testConfig .mode .textButton[mode='" + Config.mode + "']")?.addClass(
    "active",
  );

  qs("#testConfig .puncAndNum")?.hide();
  qsa("#testConfig .spacer")?.hide();
  qs("#testConfig .time")?.hide();
  qs("#testConfig .wordCount")?.hide();
  qs("#testConfig .customText")?.hide();
  qs("#testConfig .quoteLength")?.hide();
  qs("#testConfig .zen")?.hide();

  if (Config.mode === "time") {
    qs("#testConfig .puncAndNum")?.show()?.setStyle({
      width: "",
      opacity: "",
    });
    qs("#testConfig .leftSpacer")?.show();
    qs("#testConfig .rightSpacer")?.show();
    qs("#testConfig .time")?.show();

    updateActiveExtraButtons("time", Config.time);
  } else if (Config.mode === "words") {
    qs("#testConfig .puncAndNum")?.show()?.setStyle({
      width: "",
      opacity: "",
    });
    qs("#testConfig .leftSpacer")?.show();
    qs("#testConfig .rightSpacer")?.show();
    qs("#testConfig .wordCount")?.show();

    updateActiveExtraButtons("words", Config.words);
  } else if (Config.mode === "quote") {
    qs("#testConfig .rightSpacer")?.show();
    qs("#testConfig .quoteLength")?.show();

    updateActiveExtraButtons("quoteLength", Config.quoteLength);
  } else if (Config.mode === "custom") {
    qs("#testConfig .puncAndNum")?.show()?.setStyle({
      width: "",
      opacity: "",
    });
    qs("#testConfig .leftSpacer")?.show();
    qs("#testConfig .rightSpacer")?.show();
    qs("#testConfig .customText")?.show();
  }

  updateActiveExtraButtons("numbers", Config.numbers);
  updateActiveExtraButtons("punctuation", Config.punctuation);
}

async function update(previous: Mode, current: Mode): Promise<void> {
  if (previous === current) return;
  updateActiveModeButtons(current);

  if (current === "time") {
    updateActiveExtraButtons("time", Config.time);
  } else if (current === "words") {
    updateActiveExtraButtons("words", Config.words);
  } else if (current === "quote") {
    updateActiveExtraButtons("quoteLength", Config.quoteLength);
  }

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

  const puncAndNumEl = qs("#testConfig .puncAndNum");

  if (puncAndNumVisible[current] !== puncAndNumVisible[previous]) {
    puncAndNumEl
      ?.setStyle({
        width: "unset",
        opacity: "1",
      })
      ?.show();

    const width = Math.round(
      puncAndNumEl?.native.getBoundingClientRect().width ?? 0,
    );

    puncAndNumEl?.animate({
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
          puncAndNumEl?.setStyle({ width: "unset" });
        } else {
          puncAndNumEl?.hide();
        }
      },
    });

    const leftSpacerEl = qs("#testConfig .leftSpacer");

    leftSpacerEl?.setStyle({ width: "0.5em" });
    leftSpacerEl?.setStyle({ opacity: "1" });
    leftSpacerEl?.show();

    leftSpacerEl?.animate({
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
          leftSpacerEl?.setStyle({ width: "" });
        } else {
          leftSpacerEl?.hide();
        }
      },
    });
  }

  const rightSpacerEl = qs("#testConfig .rightSpacer");

  rightSpacerEl?.setStyle({ width: "0.5em" });
  rightSpacerEl?.setStyle({ opacity: "1" });
  rightSpacerEl?.show();

  rightSpacerEl?.animate({
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
        rightSpacerEl?.hide();
      } else {
        rightSpacerEl?.setStyle({ width: "" });
      }
    },
  });

  const currentEl = qs(`#testConfig .${submenu[current]}`);
  const previousEl = qs(`#testConfig .${submenu[previous]}`);

  const previousWidth = Math.round(
    previousEl?.native.getBoundingClientRect().width ?? 0,
  );

  previousEl?.hide();
  currentEl?.show();

  const currentWidth = Math.round(
    currentEl?.native.getBoundingClientRect().width ?? 0,
  );

  previousEl?.show();
  currentEl?.hide();

  const widthDifference = currentWidth - previousWidth;
  const widthStep = widthDifference / 2;

  await previousEl?.promiseAnimate({
    opacity: [1, 0],
    width: [previousWidth + "px", previousWidth + widthStep + "px"],
    duration: animTime / 2,
    ease: easing.in,
  });

  previousEl
    ?.setStyle({
      opacity: "1",
      width: "unset",
    })
    ?.hide();
  currentEl
    ?.setStyle({
      opacity: "0",
      width: previousWidth + widthStep + "px",
    })
    ?.show();

  await currentEl?.promiseAnimate({
    opacity: [0, 1],
    width: [previousWidth + widthStep + "px", currentWidth + "px"],
    duration: animTime / 2,
    ease: easing.out,
  });

  currentEl?.setStyle({ width: "" });
}

function updateActiveModeButtons(mode: Mode): void {
  qsa("#testConfig .mode .textButton")?.removeClass("active");
  qs("#testConfig .mode .textButton[mode='" + mode + "']")?.addClass("active");
}

function updateActiveExtraButtons(key: string, value: ConfigValue): void {
  if (key === "time") {
    qsa("#testConfig .time .textButton")?.removeClass("active");
    const timeCustom = ![15, 30, 60, 120].includes(value as number)
      ? "custom"
      : (value as number);
    qs(
      "#testConfig .time .textButton[timeConfig='" + timeCustom + "']",
    )?.addClass("active");
  } else if (key === "words") {
    qsa("#testConfig .wordCount .textButton")?.removeClass("active");

    const wordCustom = ![10, 25, 50, 100, 200].includes(value as number)
      ? "custom"
      : (value as number);

    qs(
      "#testConfig .wordCount .textButton[wordCount='" + wordCustom + "']",
    )?.addClass("active");
  } else if (key === "quoteLength") {
    qsa("#testConfig .quoteLength .textButton")?.removeClass("active");

    if (areUnsortedArraysEqual(value as QuoteLength[], [0, 1, 2, 3])) {
      qs("#testConfig .quoteLength .textButton[quotelength='all']")?.addClass(
        "active",
      );
    } else {
      (value as QuoteLength[]).forEach((ql) => {
        qs(
          "#testConfig .quoteLength .textButton[quoteLength='" + ql + "']",
        )?.addClass("active");
      });
    }
  } else if (key === "numbers") {
    if (value === false) {
      qs("#testConfig .numbersMode.textButton")?.removeClass("active");
    } else {
      qs("#testConfig .numbersMode.textButton")?.addClass("active");
    }
  } else if (key === "punctuation") {
    if (value === false) {
      qs("#testConfig .punctuationMode.textButton")?.removeClass("active");
    } else {
      qs("#testConfig .punctuationMode.textButton")?.addClass("active");
    }
  }
}

export function showFavoriteQuoteLength(): void {
  qs("#testConfig .quoteLength .favorite")?.show();
}

export function hideFavoriteQuoteLength(): void {
  qs("#testConfig .quoteLength .favorite")?.hide();
}

let ignoreConfigEvent = false;

ConfigEvent.subscribe(({ key, newValue, previousValue }) => {
  if (key === "fullConfigChange") {
    ignoreConfigEvent = true;
  }
  if (key === "fullConfigChangeFinished") {
    ignoreConfigEvent = false;

    void instantUpdate();
  }

  // this is here to prevent calling set / preview multiple times during a full config loading
  // once the full config is loaded, we can apply everything once
  if (ignoreConfigEvent) return;

  if (getActivePage() !== "test") return;
  if (key === "mode") {
    void update(previousValue, newValue);
  } else if (
    ["time", "quoteLength", "words", "numbers", "punctuation"].includes(
      key ?? "",
    )
  ) {
    if (newValue !== undefined) {
      updateActiveExtraButtons(key, newValue);
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
