import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";

export async function update(burst: number): Promise<void> {
  if (!Config.showLiveBurst) return;
  (document.querySelector("#miniTimerAndLiveWpm .burst") as Element).innerHTML =
    burst.toString();
  (document.querySelector("#liveBurst") as Element).innerHTML =
    burst.toString();
}

export function show(): void {
  if (!Config.showLiveBurst) return;
  if (!TestState.isActive) return;
  if (Config.timerStyle === "mini") {
    if (!$("#miniTimerAndLiveWpm .burst").hasClass("hidden")) return;
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
    if (!$("#liveBurst").hasClass("hidden")) return;
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
}

export function hide(): void {
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
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "showLiveBurst") eventValue ? show() : hide();
});
