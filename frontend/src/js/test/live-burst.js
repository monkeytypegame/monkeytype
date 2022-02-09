import Config from "../config";
import * as TestLogic from "./test-logic";

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
  if (!TestLogic.active) return;
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
