import Config from "../config";
import * as CustomText from "./custom-text";
import * as DateTime from "../utils/date-and-time";
import * as TestWords from "./test-words";
import * as TestInput from "./test-input";
import * as Time from "../states/time";
import * as SlowTimer from "../states/slow-timer";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";

const barEl = $("#barTimerProgress .bar");
const barOpacityEl = $("#barTimerProgress .opacityWrapper");
const textEl = $("#liveStatsTextTop .timerProgress");
const miniEl = $("#liveStatsMini .time");

export function show(): void {
  if (Config.mode !== "zen" && Config.timerStyle === "bar") {
    barOpacityEl
      .stop(true, true)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125
      );
  } else if (Config.timerStyle === "text") {
    textEl.stop(true, true).removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: 1,
      },
      125
    );
  } else if (Config.mode === "zen" || Config.timerStyle === "mini") {
    miniEl.stop(true, true).removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: 1,
      },
      125
    );
  }
}

export function reset(): void {
  let width = "0vw";
  if (
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time")
  ) {
    width = "100vw";
  }
  barEl.stop(true, true).animate(
    {
      width,
    },
    0
  );
  miniEl.text("0");
  textEl.text("0");
}

export function hide(): void {
  barOpacityEl.stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
  miniEl.stop(true, true).animate(
    {
      opacity: 0,
    },
    125,
    () => {
      miniEl.addClass("hidden");
    }
  );
  textEl.stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

const timerNumberElement = textEl[0] as HTMLElement;
const miniTimerNumberElement = miniEl[0] as HTMLElement;

function getCurrentCount(): number {
  if (Config.mode === "custom" && CustomText.getLimitMode() === "section") {
    return (
      (TestWords.words.sectionIndexList[
        TestWords.words.currentIndex
      ] as number) - 1
    );
  } else {
    return TestInput.input.history.length;
  }
}

export function update(): void {
  const time = Time.get();
  if (
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time")
  ) {
    let maxtime = Config.time;
    if (Config.mode === "custom" && CustomText.getLimitMode() === "time") {
      maxtime = CustomText.getLimitValue();
    }
    if (Config.timerStyle === "bar") {
      const percent = 100 - ((time + 1) / maxtime) * 100;
      barEl.stop(true, true).animate(
        {
          width: percent + "vw",
        },
        SlowTimer.get() ? 0 : 1000,
        "linear"
      );
    } else if (Config.timerStyle === "text") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      if (timerNumberElement !== null) {
        timerNumberElement.innerHTML = "<div>" + displayTime + "</div>";
      }
    } else if (Config.timerStyle === "mini") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      if (miniTimerNumberElement !== null) {
        miniTimerNumberElement.innerHTML = displayTime;
      }
    }
  } else if (
    Config.mode === "words" ||
    Config.mode === "custom" ||
    Config.mode === "quote"
  ) {
    let outof = TestWords.words.length;
    if (Config.mode === "words") {
      outof = Config.words;
    }
    if (Config.mode === "custom") {
      outof = CustomText.getLimitValue();
    }
    if (Config.mode === "quote") {
      outof = TestWords.currentQuote?.textSplit.length ?? 1;
    }
    if (Config.timerStyle === "bar") {
      const percent = Math.floor(
        ((TestWords.words.currentIndex + 1) / outof) * 100
      );
      barEl.stop(true, true).animate(
        {
          width: percent + "vw",
        },
        SlowTimer.get() ? 0 : 250
      );
    } else if (Config.timerStyle === "text") {
      if (outof === 0) {
        if (timerNumberElement !== null) {
          timerNumberElement.innerHTML =
            "<div>" + `${TestInput.input.history.length}` + "</div>";
        }
      } else {
        if (timerNumberElement !== null) {
          timerNumberElement.innerHTML =
            "<div>" + `${getCurrentCount()}/${outof}` + "</div>";
        }
      }
    } else if (Config.timerStyle === "mini") {
      if (outof === 0) {
        if (miniTimerNumberElement !== null) {
          miniTimerNumberElement.innerHTML = `${TestInput.input.history.length}`;
        }
      } else {
        if (miniTimerNumberElement !== null) {
          miniTimerNumberElement.innerHTML = `${getCurrentCount()}/${outof}`;
        }
      }
    }
  } else if (Config.mode === "zen") {
    if (Config.timerStyle === "text") {
      if (timerNumberElement !== null) {
        timerNumberElement.innerHTML =
          "<div>" + `${TestInput.input.history.length}` + "</div>";
      }
    } else {
      if (miniTimerNumberElement !== null) {
        miniTimerNumberElement.innerHTML = `${TestInput.input.history.length}`;
      }
    }
  }
}

export function updateStyle(): void {
  if (!TestState.isActive) return;
  hide();
  update();
  if (Config.timerStyle === "off") return;
  setTimeout(() => {
    show();
  }, 125);
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "timerStyle") updateStyle();
});
