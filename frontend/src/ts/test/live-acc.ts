import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";

const textEl = document.querySelector(
  "#liveStatsTextBottom .liveAcc"
) as Element;
const miniEl = document.querySelector("#liveStatsMini .acc") as Element;

export function update(acc: number): void {
  let number = Math.floor(acc);
  if (Config.blindMode) {
    number = 100;
  }
  miniEl.innerHTML = number + "%";
  textEl.innerHTML = number + "%";
}

export function reset(): void {
  miniEl.innerHTML = "100%";
  textEl.innerHTML = "100%";
}

let state = false;

export function show(): void {
  if (Config.liveAccStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.liveAccStyle === "mini") {
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
  if (eventKey === "liveAccStyle") eventValue === "off" ? hide() : show();
});
