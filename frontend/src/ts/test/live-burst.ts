import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";

const textEl = document.querySelector(
  "#liveStatsTextBottom .liveBurst"
) as Element;
const miniEl = document.querySelector("#liveStatsMini .burst") as Element;

export function reset(): void {
  textEl.innerHTML = "0";
  miniEl.innerHTML = "0";
}

export async function update(burst: number): Promise<void> {
  const burstText = Format.typingSpeed(burst, { showDecimalPlaces: false });
  miniEl.innerHTML = burstText;
  textEl.innerHTML = burstText;
}

let state = false;

export function show(): void {
  if (Config.liveBurstStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.liveBurstStyle === "mini") {
    $(miniEl).stop(true, false).removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: 1,
      },
      125
    );
  } else {
    $(textEl).stop(true, false).removeClass("hidden").css("opacity", 0).animate(
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
  $(textEl)
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $(textEl).addClass("hidden");
      }
    );
  $(miniEl)
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $(miniEl).addClass("hidden");
      }
    );
  state = false;
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "liveBurstStyle") eventValue === "off" ? hide() : show();
});
