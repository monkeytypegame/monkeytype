import Config from "../config";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";

const liveSpeedElement = document.querySelector("#liveSpeed") as Element;
const miniLiveSpeedElement = document.querySelector(
  "#miniTimerAndLiveSpeed .wpm"
) as Element;

export function update(wpm: number, raw: number): void {
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  if (Config.alwaysShowCPM) {
    number = Math.round(number * 5);
  }
  miniLiveSpeedElement.innerHTML = number.toString();
  liveSpeedElement.innerHTML = number.toString();
}

export function show(): void {
  if (!Config.liveSpeed) return;
  if (!TestState.isActive) return;
  if (Config.timerStyle === "mini") {
    if (!miniLiveSpeedElement.classList.contains("hidden")) return;
    $(miniLiveSpeedElement)
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
    if (!liveSpeedElement.classList.contains("hidden")) return;
    $(liveSpeedElement)
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
  $(liveSpeedElement)
    .stop(true, true)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        liveSpeedElement.classList.add("hidden");
      }
    );
  $(miniLiveSpeedElement)
    .stop(true, true)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        miniLiveSpeedElement.classList.add("hidden");
      }
    );
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "liveSpeed") eventValue ? show() : hide();
});
