import Config from "../config";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";

const textElement = document.querySelector(
  "#liveStatsTextBottom .liveSpeed"
) as Element;
const miniElement = document.querySelector("#liveStatsMini .speed") as Element;

export function reset(): void {
  textElement.innerHTML = "0";
  miniElement.innerHTML = "0";
}

export function update(wpm: number, raw: number): void {
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  const numberText = Format.typingSpeed(number, { showDecimalPlaces: false });
  textElement.innerHTML = numberText;
  miniElement.innerHTML = numberText;
}

let state = false;

export function show(): void {
  if (Config.liveSpeedStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.liveSpeedStyle === "mini") {
    $(miniElement)
      .stop(true, false)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125
      );
  } else {
    $(textElement)
      .stop(true, false)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125
      );
  }
  state = true;
}

export function hide(): void {
  if (!state) return;
  $(textElement)
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        textElement.classList.add("hidden");
      }
    );
  $(miniElement)
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        miniElement.classList.add("hidden");
      }
    );
  state = false;
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "liveSpeedStyle") eventValue === "off" ? hide() : show();
});
