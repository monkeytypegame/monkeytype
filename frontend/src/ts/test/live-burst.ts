import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";

export async function update(burst: number): Promise<void> {
  if (!Config.showLiveBurst) return;
  const burstText = Format.typingSpeed(burst, { showDecimalPlaces: false });
  (document.querySelector("#miniTimerAndLiveWpm .burst") as Element).innerHTML =
    burstText;
  (document.querySelector("#liveBurst") as Element).innerHTML = burstText;
}

let state = false;

export function show(): void {
  if (!Config.showLiveBurst) return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.timerStyle === "mini") {
    $("#miniTimerAndLiveWpm .burst")
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
    $("#liveBurst")
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
  $("#liveBurst")
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#liveBurst").addClass("hidden");
      }
    );
  $("#miniTimerAndLiveWpm .burst")
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#miniTimerAndLiveWpm .burst").addClass("hidden");
      }
    );
  state = false;
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "showLiveBurst") (eventValue as boolean) ? show() : hide();
});
