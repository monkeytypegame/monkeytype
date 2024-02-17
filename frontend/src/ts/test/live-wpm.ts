import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import * as Format from "../utils/format";

const liveWpmElement = document.querySelector("#liveWpm") as Element;
const miniLiveWpmElement = document.querySelector(
  "#miniTimerAndLiveWpm .wpm"
) as Element;

export function update(wpm: number, raw: number): void {
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  const numberText = Format.typingSpeed(number, { showDecimalPlaces: false });
  miniLiveWpmElement.innerHTML = numberText;
  liveWpmElement.innerHTML = numberText;
}

let state = false;

export function show(): void {
  if (!Config.showLiveWpm) return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.timerStyle === "mini") {
    $(miniLiveWpmElement)
      .stop(true, false)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: Config.timerOpacity,
        },
        125
      );
  } else {
    $(liveWpmElement)
      .stop(true, false)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: Config.timerOpacity,
        },
        125
      );
  }
  state = true;
}

export function hide(): void {
  if (!state) return;
  $(liveWpmElement)
    .stop(true, false)
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
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        miniLiveWpmElement.classList.add("hidden");
      }
    );
  state = false;
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "showLiveWpm") (eventValue as boolean) ? show() : hide();
});
