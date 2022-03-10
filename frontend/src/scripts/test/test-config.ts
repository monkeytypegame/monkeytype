import * as ConfigEvent from "../observables/config-event";
import * as Misc from "../misc";

// export function show() {
//   $("#top .config").removeClass("hidden").css("opacity", 1);
// }

// export function hide() {
//   $("#top .config").css("opacity", 0).addClass("hidden");
// }

export function show(): void {
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

export function hide(): void {
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

export function update(
  previous: MonkeyTypes.Mode,
  current: MonkeyTypes.Mode
): void {
  if (previous === current) return;
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

ConfigEvent.subscribe((eventKey, eventValue, _nosave, eventPreviousValue) => {
  if (eventKey === "mode") {
    update(
      eventPreviousValue as MonkeyTypes.Mode,
      eventValue as MonkeyTypes.Mode
    );
  }
});
