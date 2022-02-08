import Config from "../config";
import * as TestLogic from "./test-logic";

export function update(acc) {
  let number = Math.floor(acc);
  if (Config.blindMode) {
    number = 100;
  }
  document.querySelector("#miniTimerAndLiveWpm .acc").innerHTML = number + "%";
  document.querySelector("#liveAcc").innerHTML = number + "%";
}

export function show() {
  if (!Config.showLiveAcc) return;
  if (!TestLogic.active) return;
  if (Config.timerStyle === "mini") {
    // $("#miniTimerAndLiveWpm .wpm").css("opacity", Config.timerOpacity);
    if (!$("#miniTimerAndLiveWpm .acc").hasClass("hidden")) return;
    $("#miniTimerAndLiveWpm .acc")
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: Config.timerOpacity,
        },
        125
      );
  } else {
    // $("#liveWpm").css("opacity", Config.timerOpacity);
    if (!$("#liveAcc").hasClass("hidden")) return;
    $("#liveAcc").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: Config.timerOpacity,
      },
      125
    );
  }
}

export function hide() {
  // $("#liveWpm").css("opacity", 0);
  // $("#miniTimerAndLiveWpm .wpm").css("opacity", 0);
  $("#liveAcc").animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      $("#liveAcc").addClass("hidden");
    }
  );
  $("#miniTimerAndLiveWpm .acc").animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      $("#miniTimerAndLiveWpm .acc").addClass("hidden");
    }
  );
}
