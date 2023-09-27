import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";

export function show(): void {
  $("#testConfig").removeClass("invisible");
  $("#mobileTestConfig").removeClass("invisible");
}

export function hide(): void {
  $("#testConfig").addClass("invisible");
  $("#mobileTestConfig").addClass("invisible");
}

export async function instantUpdate(): Promise<void> {
  $("#testConfig .mode .textButton").removeClass("active");
  $("#testConfig .mode .textButton[mode='" + Config.mode + "']").addClass(
    "active"
  );

  $("#testConfig .puncAndNum").css({
    maxWidth: 0,
    opacity: 0,
  });
  $("#testConfig .spacer").addClass("scrolled");
  $("#testConfig .time").addClass("hidden");
  $("#testConfig .wordCount").addClass("hidden");
  $("#testConfig .customText").addClass("hidden");
  $("#testConfig .quoteLength").addClass("hidden");
  $("#testConfig .zen").addClass("hidden");

  if (Config.mode === "time") {
    $("#testConfig .puncAndNum").css({
      maxWidth: "",
      opacity: 1,
    });
    $("#testConfig .leftSpacer").removeClass("scrolled");
    $("#testConfig .rightSpacer").removeClass("scrolled");
    $("#testConfig .time").removeClass("hidden");

    updateExtras("time", Config.time);
  } else if (Config.mode === "words") {
    $("#testConfig .puncAndNum").css({
      maxWidth: "",
      opacity: 1,
    });

    $("#testConfig .leftSpacer").removeClass("scrolled");
    $("#testConfig .rightSpacer").removeClass("scrolled");

    $("#testConfig .wordCount").removeClass("hidden");

    updateExtras("words", Config.words);
  } else if (Config.mode === "quote") {
    $("#testConfig .rightSpacer").removeClass("scrolled");
    $("#testConfig .quoteLength").removeClass("hidden");

    updateExtras("quoteLength", Config.quoteLength);
  } else if (Config.mode === "custom") {
    $("#testConfig .puncAndNum").css({
      maxWidth: "",
      opacity: 1,
    });

    $("#testConfig .leftSpacer").removeClass("scrolled");
    $("#testConfig .rightSpacer").removeClass("scrolled");

    $("#testConfig .customText").removeClass("hidden");
  }

  updateExtras("numbers", Config.numbers);
  updateExtras("punctuation", Config.punctuation);
}

export async function update(
  previous: MonkeyTypes.Mode,
  current: MonkeyTypes.Mode
): Promise<void> {
  if (previous === current) return;
  $("#testConfig .mode .textButton").removeClass("active");
  $("#testConfig .mode .textButton[mode='" + current + "']").addClass("active");

  const submenu = {
    time: "time",
    words: "wordCount",
    custom: "customText",
    quote: "quoteLength",
    zen: "zen",
  };

  const animTime = 250;
  const easing = {
    both: "easeInOutSine",
    in: "easeInSine",
    out: "easeOutSine",
  };
  // const easing = {
  //   both: "linear",
  //   in: "linear",
  //   out: "linear",
  // };

  const puncAndNumVisible = {
    time: true,
    words: true,
    custom: true,
    quote: false,
    zen: false,
  };

  const puncAndNumEl = $("#testConfig .puncAndNum");

  if (
    puncAndNumVisible[previous] === false &&
    puncAndNumVisible[current] === true
  ) {
    //show

    puncAndNumEl.css("maxWidth", "");

    const puncAndNumWidth = Math.round(
      puncAndNumEl[0]?.getBoundingClientRect().width ?? 224
    );

    $("#testConfig .leftSpacer").removeClass("scrolled");
    puncAndNumEl
      .css({
        opacity: 0,
        maxWidth: 0,
      })
      .animate(
        {
          opacity: 1,
          maxWidth: puncAndNumWidth,
        },
        animTime,
        easing.both
      );
  } else if (
    puncAndNumVisible[previous] === true &&
    puncAndNumVisible[current] === false
  ) {
    //hide
    $("#testConfig .leftSpacer").addClass("scrolled");
    puncAndNumEl
      .css({
        opacity: 1,
        maxWidth: "",
      })
      .animate(
        {
          opacity: 0,
          maxWidth: "0",
        },
        animTime,
        easing.both
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

export function updateExtras(
  key: string,
  value: MonkeyTypes.ConfigValues
): void {
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
    (value as MonkeyTypes.QuoteLength[]).forEach((ql) => {
      $(
        "#testConfig .quoteLength .textButton[quoteLength='" + ql + "']"
      ).addClass("active");
    });
  } else if (key === "numbers") {
    if (!value) {
      $("#testConfig .numbersMode.textButton").removeClass("active");
    } else {
      $("#testConfig .numbersMode.textButton").addClass("active");
    }
  } else if (key === "punctuation") {
    if (!value) {
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

ConfigEvent.subscribe((eventKey, eventValue, _nosave, eventPreviousValue) => {
  if (ActivePage.get() !== "test") return;
  if (eventKey === "mode") {
    update(
      eventPreviousValue as MonkeyTypes.Mode,
      eventValue as MonkeyTypes.Mode
    );

    let m2;

    if (Config.mode === "time") {
      m2 = Config.time;
    } else if (Config.mode === "words") {
      m2 = Config.words;
    } else if (Config.mode === "quote") {
      m2 = Config.quoteLength;
    }

    updateExtras(Config.mode, m2);
  } else if (
    ["time", "quoteLength", "words", "numbers", "punctuation"].includes(
      eventKey
    )
  ) {
    updateExtras(eventKey, eventValue);
  }
});
