import Config from "./config";
import * as CustomText from "./custom-text";
import * as Misc from "./misc";
import * as TestLogic from "./test-logic";
import * as TestTimer from "./test-timer";

export function show() {
  let op = Config.showTimerProgress ? Config.timerOpacity : 0;
  if (Config.mode != "zen" && Config.timerStyle === "bar") {
    $("#timerWrapper").stop(true, true).removeClass("hidden").animate(
      {
        opacity: op,
      },
      125
    );
  } else if (Config.timerStyle === "text") {
    $("#timerNumber")
      .stop(true, true)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: op,
        },
        125
      );
  } else if (Config.mode == "zen" || Config.timerStyle === "mini") {
    if (op > 0) {
      $("#miniTimerAndLiveWpm .time")
        .stop(true, true)
        .removeClass("hidden")
        .animate(
          {
            opacity: op,
          },
          125
        );
    }
  }
}

export function hide() {
  $("#timerWrapper").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
  $("#miniTimerAndLiveWpm .time")
    .stop(true, true)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#miniTimerAndLiveWpm .time").addClass("hidden");
      }
    );
  $("#timerNumber").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

export function restart() {
  if (Config.timerStyle === "bar") {
    if (Config.mode === "time") {
      $("#timer").stop(true, true).animate(
        {
          width: "100vw",
        },
        0
      );
    } else if (Config.mode === "words" || Config.mode === "custom") {
      $("#timer").stop(true, true).animate(
        {
          width: "0vw",
        },
        0
      );
    }
  }
}

export function update() {
  let time = TestTimer.time;
  if (
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.isTimeRandom)
  ) {
    let maxtime = Config.time;
    if (Config.mode === "custom" && CustomText.isTimeRandom) {
      maxtime = CustomText.time;
    }
    if (Config.timerStyle === "bar") {
      let percent = 100 - ((time + 1) / maxtime) * 100;
      $("#timer")
        .stop(true, true)
        .animate(
          {
            width: percent + "vw",
          },
          1000,
          "linear"
        );
    } else if (Config.timerStyle === "text") {
      let displayTime = Misc.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = Misc.secondsToString(time);
      }
      $("#timerNumber").html("<div>" + displayTime + "</div>");
    } else if (Config.timerStyle === "mini") {
      let displayTime = Misc.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = Misc.secondsToString(time);
      }
      $("#miniTimerAndLiveWpm .time").html(displayTime);
    }
  } else if (
    Config.mode === "words" ||
    Config.mode === "custom" ||
    Config.mode === "quote"
  ) {
    let outof = TestLogic.words.length;
    if (Config.mode === "words") {
      outof = Config.words;
    }
    if (Config.mode === "custom") {
      if (CustomText.isWordRandom) {
        outof = CustomText.word;
      } else {
        outof = CustomText.text.length;
      }
    }
    if (Config.mode === "quote") {
      outof = TestLogic.randomQuote.textSplit.length;
    }
    if (Config.timerStyle === "bar") {
      let percent = Math.floor(
        ((TestLogic.words.currentIndex + 1) / outof) * 100
      );
      $("#timer")
        .stop(true, true)
        .animate(
          {
            width: percent + "vw",
          },
          250
        );
    } else if (Config.timerStyle === "text") {
      if (outof === 0) {
        $("#timerNumber").html(
          "<div>" + `${TestLogic.input.history.length}` + "</div>"
        );
      } else {
        $("#timerNumber").html(
          "<div>" + `${TestLogic.input.history.length}/${outof}` + "</div>"
        );
      }
    } else if (Config.timerStyle === "mini") {
      if (Config.words === 0) {
        $("#miniTimerAndLiveWpm .time").html(
          `${TestLogic.input.history.length}`
        );
      } else {
        $("#miniTimerAndLiveWpm .time").html(
          `${TestLogic.input.history.length}/${outof}`
        );
      }
    }
  } else if (Config.mode == "zen") {
    if (Config.timerStyle === "text") {
      $("#timerNumber").html(
        "<div>" + `${TestLogic.input.history.length}` + "</div>"
      );
    } else {
      $("#miniTimerAndLiveWpm .time").html(`${TestLogic.input.history.length}`);
    }
  }
}
