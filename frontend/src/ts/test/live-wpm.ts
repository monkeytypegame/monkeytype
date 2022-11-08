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
    if (!$("#miniTimerAndLiveWpm .wpm").hasClass("hidden")) return;
    $("#miniTimerAndLiveWpm .wpm")
      .stop(true, true)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: Config.timerOpacity,
        },
        125
      );
  } else {
    if (!$("#liveWpm").hasClass("hidden")) return;
    $("#liveWpm")
      .stop(true, true)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: Config.timerOpacity,
        },
        125
      );
  }
}

export function hide(): void {
  $("#liveWpm")
    .stop(true, true)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#liveWpm").addClass("hidden");
      }
    );
  $("#miniTimerAndLiveWpm .wpm")
    .stop(true, true)
    .animate(
      {
        opacity: 0,
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
