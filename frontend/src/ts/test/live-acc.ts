import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";

export function update(acc: number): void {
  let number = Math.floor(acc);
  if (Config.blindMode) {
    number = 100;
  }
  (document.querySelector("#miniTimerAndLiveWpm .acc") as Element).innerHTML =
    number + "%";
  (document.querySelector("#liveAcc") as Element).innerHTML = number + "%";
}

let state = false;

export function show(): void {
  if (!Config.showLiveAcc) return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.timerStyle === "mini") {
    $("#miniTimerAndLiveWpm .acc")
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
    $("#liveAcc")
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
  // $("#liveWpm").css("opacity", 0);
  // $("#miniTimerAndLiveWpm .wpm").css("opacity", 0);
  if (!state) return;
  $("#liveAcc")
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#liveAcc").addClass("hidden");
      }
    );
  $("#miniTimerAndLiveWpm .acc")
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#miniTimerAndLiveWpm .acc").addClass("hidden");
      }
    );
  state = false;
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "showLiveAcc") eventValue ? show() : hide();
});
