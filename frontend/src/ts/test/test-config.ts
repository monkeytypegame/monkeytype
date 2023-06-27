import * as ConfigEvent from "../observables/config-event";
// import * as Misc from "../utils/misc";

// export function show() {
//   $("#top .config").removeClass("hidden").css("opacity", 1);
// }

// export function hide() {
//   $("#top .config").css("opacity", 0).addClass("hidden");
// }

export function show(): void {
  $("#testConfig").removeClass("invisible");
  $("#mobileTestConfig").removeClass("invisible");
}

export function hide(): void {
  $("#testConfig").addClass("invisible");
  $("#mobileTestConfig").addClass("invisible");
}

export async function update(
  previous: MonkeyTypes.Mode,
  current: MonkeyTypes.Mode
): Promise<void> {
  if (previous === current) return;
  $("#testConfig .mode .textButton").removeClass("active");
  $("#testConfig .mode .textButton[mode='" + current + "']").addClass("active");

  // if (current === "time") {
  //   $("#testConfig .punctuationMode").removeClass("hidden");
  //   $("#testConfig .numbersMode").removeClass("hidden");
  //   $("#testConfig .leftSpacer").removeClass("hidden");
  // } else if (current === "words") {
  //   $("#testConfig .punctuationMode").removeClass("hidden");
  //   $("#testConfig .numbersMode").removeClass("hidden");
  //   $("#testConfig .leftSpacer").removeClass("hidden");
  // } else if (current === "custom") {
  //   $("#testConfig .punctuationMode").removeClass("hidden");
  //   $("#testConfig .numbersMode").removeClass("hidden");
  //   $("#testConfig .leftSpacer").removeClass("hidden");
  // } else if (current === "quote") {
  //   $("#testConfig .punctuationMode").addClass("hidden");
  //   $("#testConfig .numbersMode").addClass("hidden");
  //   $("#testConfig .leftSpacer").addClass("hidden");
  // } else if (current === "zen") {
  //   //
  // }

  const submenu = {
    time: "time",
    words: "wordCount",
    custom: "customText",
    quote: "quoteLength",
    zen: "zen",
  };

  const animTime = 250;

  const puncAndNumVisible = {
    time: true,
    words: true,
    custom: true,
    quote: false,
    zen: false,
  };

  if (
    puncAndNumVisible[previous] === false &&
    puncAndNumVisible[current] === true
  ) {
    //show

    $("#testConfig .leftSpacer").removeClass("scrolled");
    $("#testConfig .puncAndNum")
      .css({
        opacity: 0,
        maxWidth: 0,
      })
      .animate(
        {
          opacity: 1,
          maxWidth: "14rem",
        },
        animTime,
        "easeInOutSine"
      );
  } else if (
    puncAndNumVisible[previous] === true &&
    puncAndNumVisible[current] === false
  ) {
    //hide
    $("#testConfig .leftSpacer").addClass("scrolled");
    $("#testConfig .puncAndNum")
      .css({
        opacity: 1,
        maxWidth: "14rem",
      })
      .animate(
        {
          opacity: 0,
          maxWidth: "0",
        },
        animTime,
        "easeInOutSine"
      );
  }

  if (current === "zen") {
    $("#testConfig .rightSpacer").addClass("scrolled");
  } else {
    $("#testConfig .rightSpacer").removeClass("scrolled");
  }

  // const currentWidth = Math.round(
  //   document.querySelector("#testConfig .row")?.getBoundingClientRect().width ??
  //     0
  // );

  // if (puncAndNumVisible[current]) {
  //   $("#testConfig .punctuationMode").removeClass("hidden");
  //   $("#testConfig .numbersMode").removeClass("hidden");
  //   $("#testConfig .leftSpacer").removeClass("hidden");
  // } else {
  //   $("#testConfig .punctuationMode").addClass("hidden");
  //   $("#testConfig .numbersMode").addClass("hidden");
  //   $("#testConfig .leftSpacer").addClass("hidden");
  // }

  // if (current === "zen") {
  //   $("#testConfig .rightSpacer").addClass("hidden");
  // } else {
  //   $("#testConfig .rightSpacer").removeClass("hidden");
  // }

  const previousWidth = Math.round(
    document
      .querySelector(`#testConfig .${submenu[previous]}`)
      ?.getBoundingClientRect().width ?? 0
  );

  $(`#testConfig .${submenu[previous]}`).addClass("hidden");

  $(`#testConfig .${submenu[current]}`).removeClass("hidden");

  const currentWidth = Math.round(
    document
      .querySelector(`#testConfig .${submenu[current]}`)
      ?.getBoundingClientRect().width ?? 0
  );

  $(`#testConfig .${submenu[previous]}`).removeClass("hidden");

  $(`#testConfig .${submenu[current]}`).addClass("hidden");

  const widthDifference = currentWidth - previousWidth;

  const widthStep = widthDifference / 2;

  $(`#testConfig .${submenu[previous]}`)
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
      "easeInSine",
      () => {
        $(`#testConfig .${submenu[previous]}`)
          .css({
            opacity: 1,
            width: "unset",
          })
          .addClass("hidden");
        $(`#testConfig .${submenu[current]}`)
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
            "easeOutSine",
            () => {
              $(`#testConfig .${submenu[current]}`).css("width", "unset");
            }
          );
      }
    );

  // $(`#testConfig .${submenu[current]}`)
  //   .css({
  //     opacity: 0,
  //     maxWidth: previousWidth,
  //   })
  //   .removeClass("hidden")
  //   .animate(
  //     {
  //       maxWidth: currentWidth,
  //       opacity: 1,
  //     },
  //     250,
  //     () => {
  //       $(`#testConfig .${submenu[current]}`).css({
  //         opacity: 1,
  //         maxWidth: "unset",
  //       });
  //     }
  //   );

  // const newWidth = Math.round(
  //   document.querySelector("#testConfig .row")?.getBoundingClientRect().width ??
  //     0
  // );

  // console.log(submenu[current], animTime, newWidth, currentWidth);

  // if (current === "zen") {
  //   $(`#testConfig .${submenu[previous]}`).animate(
  //     {
  //       opacity: 0,
  //     },
  //     animTime / 2,
  //     () => {
  //       $(`#testConfig .${submenu[previous]}`).addClass("hidden");
  //     }
  //   );
  //   $(`#testConfig .puncAndNum`).animate(
  //     {
  //       opacity: 0,
  //     },
  //     animTime / 2,
  //     () => {
  //       $(`#testConfig .puncAndNum`).addClass("hidden");
  //     }
  //   );
  //   return;
  // }

  // if (previous === "zen") {
  //   setTimeout(() => {
  //     $(`#testConfig .${submenu[current]}`).removeClass("hidden");
  //     $(`#testConfig .${submenu[current]}`)
  //       .css({ opacity: 0 })
  //       .animate(
  //         {
  //           opacity: 1,
  //         },
  //         animTime / 2
  //       );
  //     $(`#testConfig .puncAndNum`).removeClass("hidden");
  //     $(`#testConfig .puncAndNum`)
  //       .css({ opacity: 0 })
  //       .animate(
  //         {
  //           opacity: 1,
  //         },
  //         animTime / 2
  //       );
  //   }, animTime / 2);
  //   return;
  // }

  // Misc.swapElements(
  //   $("#testConfig ." + submenu[previous]),
  //   $("#testConfig ." + submenu[current]),
  //   animTime
  // );
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
  if (eventKey === "mode") {
    update(
      eventPreviousValue as MonkeyTypes.Mode,
      eventValue as MonkeyTypes.Mode
    );
  } else if (
    ["time", "quoteLength", "words", "numbers", "punctuation"].includes(
      eventKey
    )
  ) {
    updateExtras(eventKey, eventValue);
  }
});
