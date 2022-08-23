import * as ConfigEvent from "../observables/config-event";
import * as Misc from "../utils/misc";

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
  $("#testConfig .mode.textButton").removeClass("active");
  $("#testConfig .mode.textButton[mode='" + current + "']").addClass("active");

  if (current == "time") {
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
  } else if (current == "words") {
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
  } else if (current == "custom") {
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
  } else if (current == "quote") {
    $("#top .config .punctuationMode").addClass("disabled");
    $("#top .config .numbersMode").addClass("disabled");
  } else if (current == "zen") {
    //
  }

  const submenu = {
    time: "time",
    words: "wordCount",
    custom: "customText",
    quote: "quoteLength",
    zen: "",
  };

  const animTime = 250;

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
  }
});
