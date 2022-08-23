import * as ConfigEvent from "../observables/config-event";
// import * as Misc from "../utils/misc";

// export function show() {
//   $("#top .config").removeClass("hidden").css("opacity", 1);
// }

// export function hide() {
//   $("#top .config").css("opacity", 0).addClass("hidden");
// }

export function show(): void {
  $("#top .config")
    .css("transition", "unset")
    .stop(true, true)
    .removeClass("hidden")
    .css("opacity", 0)
    .animate(
      {
        opacity: 1,
      },
      125,
      () => {
        $("#top .config").css("transition", "0.125s");
      }
    );
}

export function hide(): void {
  $("#top .config")
    .css("transition", "unset")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#top .config").addClass("hidden").css("transition", "0.125s");
      }
    );
}

export function update(
  previous: MonkeyTypes.Mode,
  current: MonkeyTypes.Mode
): void {
  if (previous === current) return;
  $("#testConfig .mode .textButton").removeClass("active");
  $("#testConfig .mode .textButton[mode='" + current + "']").addClass("active");

  // if (current == "time") {
  //   $("#testConfig .punctuationMode").removeClass("hidden");
  //   $("#testConfig .numbersMode").removeClass("hidden");
  //   $("#testConfig .leftSpacer").removeClass("hidden");
  // } else if (current == "words") {
  //   $("#testConfig .punctuationMode").removeClass("hidden");
  //   $("#testConfig .numbersMode").removeClass("hidden");
  //   $("#testConfig .leftSpacer").removeClass("hidden");
  // } else if (current == "custom") {
  //   $("#testConfig .punctuationMode").removeClass("hidden");
  //   $("#testConfig .numbersMode").removeClass("hidden");
  //   $("#testConfig .leftSpacer").removeClass("hidden");
  // } else if (current == "quote") {
  //   $("#testConfig .punctuationMode").addClass("hidden");
  //   $("#testConfig .numbersMode").addClass("hidden");
  //   $("#testConfig .leftSpacer").addClass("hidden");
  // } else if (current == "zen") {
  //   //
  // }

  const submenu = {
    time: "time",
    words: "wordCount",
    custom: "customText",
    quote: "quoteLength",
    zen: "zen",
  };

  const puncAndNumVisible = {
    time: true,
    words: true,
    custom: true,
    quote: false,
    zen: false,
  };

  // const animTime = 250;

  if (puncAndNumVisible[current]) {
    $("#testConfig .puncAndNum").removeClass("scrolled");
  } else {
    $("#testConfig .puncAndNum").addClass("scrolled");
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

  // if (current == "zen") {
  //   $("#testConfig .rightSpacer").addClass("hidden");
  // } else {
  //   $("#testConfig .rightSpacer").removeClass("hidden");
  // }

  $(`#testConfig .${submenu[previous]}`).addClass("hidden");

  $(`#testConfig .${submenu[current]}`).removeClass("hidden");

  // const newWidth = Math.round(
  //   document.querySelector("#testConfig .row")?.getBoundingClientRect().width ??
  //     0
  // );

  // console.log(submenu[current], animTime, newWidth, currentWidth);

  // if (current == "zen") {
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

  // if (previous == "zen") {
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
  if (key == "time") {
    $("#testConfig .time .textButton").removeClass("active");
    const timeCustom = ![15, 30, 60, 120].includes(value as number)
      ? "custom"
      : value;
    $(
      "#testConfig .time .textButton[timeConfig='" + timeCustom + "']"
    ).addClass("active");
  } else if (key == "words") {
    $("#testConfig .wordCount .textButton").removeClass("active");

    const wordCustom = ![10, 25, 50, 100, 200].includes(value as number)
      ? "custom"
      : value;

    $(
      "#testConfig .wordCount .textButton[wordCount='" + wordCustom + "']"
    ).addClass("active");
  } else if (key == "quoteLength") {
    $("#testConfig .quoteLength .textButton").removeClass("active");
    (value as MonkeyTypes.QuoteLength[]).forEach((ql) => {
      $(
        "#testConfig .quoteLength .textButton[quoteLength='" + ql + "']"
      ).addClass("active");
    });
  } else if (key == "numbers") {
    if (!value) {
      $("#testConfig .numbersMode.textButton").removeClass("active");
    } else {
      $("#testConfig .numbersMode.textButton").addClass("active");
    }
  } else if (key == "punctuation") {
    if (!value) {
      $("#testConfig .punctuationMode.textButton").removeClass("active");
    } else {
      $("#testConfig .punctuationMode.textButton").addClass("active");
    }
  }
}

export function showFavoriteQuoteLength(): void {
  $("#top .desktopConfig .group.quoteLength .favorite").removeClass("hidden");
}

export function hideFavoriteQuoteLength(): void {
  $("#top .desktopConfig .group.quoteLength .favorite").addClass("hidden");
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
