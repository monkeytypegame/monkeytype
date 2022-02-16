import Config from "../config";
import * as TestActive from "../states/test-active";
import * as ConfigEvent from "../observables/config-event";

const liveWpmElement = document.querySelector("#liveWpm") as Element;
const miniLiveWpmElement = document.querySelector(
  "#miniTimerAndLiveWpm .wpm"
) as Element;

export function update(wpm: number, raw: number): void {
  // if (!TestActive.get() || !Config.showLiveWpm) {
  //   hideLiveWpm();
  // } else {
  //   showLiveWpm();
  // }
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  if (Config.alwaysShowCPM) {
    number = Math.round(number * 5);
  }
  miniLiveWpmElement.innerHTML = number.toString();
  liveWpmElement.innerHTML = number.toString();
}

export function show(): void {
  if (!Config.showLiveWpm) return;
  if (!TestActive.get()) return;
  if (Config.timerStyle === "mini") {
    // $("#miniTimerAndLiveWpm .wpm").css("opacity", Config.timerOpacity);
    if (!$("#miniTimerAndLiveWpm .wpm").hasClass("hidden")) return;
    $("#miniTimerAndLiveWpm .wpm")
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: Config.timerOpacity,
        },
        125
      );
  } else {
    // $("#liveWpm").css("opacity", Config.timerOpacity);
    if (!$("#liveWpm").hasClass("hidden")) return;
    $("#liveWpm").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: Config.timerOpacity,
      },
      125
    );
  }
}

export function hide(): void {
  $("#liveWpm").animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      $("#liveWpm").addClass("hidden");
    }
  );
  $("#miniTimerAndLiveWpm .wpm").animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      $("#miniTimerAndLiveWpm .wpm").addClass("hidden");
    }
  );
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "showLiveWpm") eventValue ? show() : hide();
});
