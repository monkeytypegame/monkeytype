import Config, * as UpdateConfig from "../config";
import * as TestLogic from "./test-logic";

let liveWpmElement = document.querySelector("#liveWpm");
let miniLiveWpmElement = document.querySelector("#miniTimerAndLiveWpm .wpm");

export function update(wpm, raw) {
  // if (!TestLogic.active || !Config.showLiveWpm) {
  //   hideLiveWpm();
  // } else {
  //   showLiveWpm();
  // }
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  if (Config.alwaysShowCPM) {
    number = Math.round(number * 5);
  }
  miniLiveWpmElement.innerHTML = number;
  liveWpmElement.innerHTML = number;
}

export function show() {
  if (!Config.showLiveWpm) return;
  if (!TestLogic.active) return;
  if (Config.timerStyle === "mini") {
    // $("#miniTimerAndLiveWpm .wpm").css("opacity", Config.timerOpacity);
    if (!$("#miniTimerAndLiveWpm .wpm").hasClass("hidden")) return;
    $("#miniTimerAndLiveWpm .wpm")
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
    if (!$("#liveWpm").hasClass("hidden")) return;
    $("#liveWpm").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: Config.timerOpacity,
      },
      125
    );
  }
}

export function hide() {
  $("#liveWpm").animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      $("#liveWpm").addClass("hidden");
    }
  );
  $("#miniTimerAndLiveWpm .wpm").animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      $("#miniTimerAndLiveWpm .wpm").addClass("hidden");
    }
  );
}

$(document).ready(() => {
  UpdateConfig.subscribeToEvent((eventKey, eventValue) => {
    if (eventKey === "showLiveWpm") eventValue ? show() : hide();
  });
});
