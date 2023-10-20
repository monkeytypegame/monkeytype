import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";

export async function update(burst: number): Promise<void> {
  if (!Config.showLiveBurst) return;
  burst = Math.round(getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(burst));
  (document.querySelector("#miniTimerAndLiveWpm .burst") as Element).innerHTML =
    burst.toString();
  (document.querySelector("#liveBurst") as Element).innerHTML =
    burst.toString();
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
  if (eventKey === "showLiveBurst") eventValue ? show() : hide();
});
