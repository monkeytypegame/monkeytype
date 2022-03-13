import Config from "../config";
import * as TestActive from "../states/test-active";
import * as ConfigEvent from "../observables/config-event";

export function update(burst: number): void {
  let number = burst;
  if (Config.blindMode) {
    number = 0;
  }
  (document.querySelector("#miniTimerAndLiveWpm .burst") as Element).innerHTML =
    number.toString();
  (document.querySelector("#liveBurst") as Element).innerHTML =
    number.toString();
}

export function show(): void {
  if (!Config.showLiveBurst) return;
  if (!TestActive.get()) return;
  if (Config.timerStyle === "mini") {
    if (!$("#miniTimerAndLiveWpm .burst").hasClass("hidden")) return;
    $("#miniTimerAndLiveWpm .burst")
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
    $("#liveBurst").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: Config.timerOpacity,
      },
      125
    );
  }
}

export function hide(): void {
  $("#liveBurst").animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      $("#liveBurst").addClass("hidden");
    }
  );
  $("#miniTimerAndLiveWpm .burst").animate(
    {
      opacity: Config.timerOpacity,
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
