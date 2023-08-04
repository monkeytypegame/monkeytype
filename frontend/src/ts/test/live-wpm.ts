import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";

const liveWpmElement = document.querySelector("#liveWpm") as Element;
const miniLiveWpmElement = document.querySelector(
  "#miniTimerAndLiveWpm .wpm"
) as Element;

export function update(wpm: number, raw: number): void {
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  number = Math.round(
    getTypingSpeedUnit(Config.typingSpeedUnit).convert(number)
  );
  miniLiveWpmElement.innerHTML = number.toString();
  liveWpmElement.innerHTML = number.toString();
}

export function show(): void {
  if (!Config.showLiveWpm) return;
  if (!TestState.isActive) return;
  if (Config.timerStyle === "mini") {
    if (!miniLiveWpmElement.classList.contains("hidden")) return;
    $(miniLiveWpmElement)
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
    if (!liveWpmElement.classList.contains("hidden")) return;
    $(liveWpmElement)
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
  $(liveWpmElement)
    .stop(true, true)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        liveWpmElement.classList.add("hidden");
      }
    );
  $(miniLiveWpmElement)
    .stop(true, true)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        miniLiveWpmElement.classList.add("hidden");
      }
    );
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "showLiveWpm") eventValue ? show() : hide();
});
