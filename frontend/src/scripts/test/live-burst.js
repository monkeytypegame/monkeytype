import Config from "../config";
import * as TestActive from "../states/test-active";
import * as ConfigEvent from "../observables/config-event";

export function update(burst) {
  let number = burst;
  if (Config.blindMode) {
    number = 0;
  }
  document.querySelector("#miniTimerAndLiveWpm .burst").innerHTML = number;
  document.querySelector("#liveBurst").innerHTML = number;
}

export function show() {
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

export function hide() {
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
