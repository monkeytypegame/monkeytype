import Config from "../config";
import * as TestActive from "../states/test-active";
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

export function show(): void {
  if (!Config.showLiveAcc) return;
  if (!TestActive.get()) return;
  if (Config.timerStyle === "mini") {
    if (!$("#miniTimerAndLiveWpm .acc").hasClass("hidden")) return;
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
    if (!$("#liveAcc").hasClass("hidden")) return;
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
}

export function hide(): void {
  // $("#liveWpm").css("opacity", 0);
  // $("#miniTimerAndLiveWpm .wpm").css("opacity", 0);
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
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "showLiveAcc") eventValue ? show() : hide();
});
