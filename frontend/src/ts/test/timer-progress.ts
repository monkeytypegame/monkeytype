import Config from "../config";
import * as CustomText from "./custom-text";
import * as DateTime from "../utils/date-and-time";
import * as TestWords from "./test-words";
import * as TestInput from "./test-input";
import * as Time from "../states/time";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";
import { applyReducedMotion } from "../utils/misc";
import { animate } from "animejs";

const barEl = document.querySelector("#barTimerProgress .bar") as HTMLElement;
const barOpacityEl = document.querySelector(
  "#barTimerProgress .opacityWrapper"
) as HTMLElement;
const textEl = document.querySelector(
  "#liveStatsTextTop .timerProgress"
) as HTMLElement;
const miniEl = document.querySelector("#liveStatsMini .time") as HTMLElement;

export function show(): void {
  if (!TestState.isActive) return;
  if (Config.mode !== "zen" && Config.timerStyle === "bar") {
    animate(barOpacityEl, {
      opacity: [0, 1],
      duration: applyReducedMotion(125),
      onBegin: () => {
        barOpacityEl.classList.remove("hidden");
      },
    });
  } else if (Config.timerStyle === "text") {
    animate(textEl, {
      opacity: [0, 1],
      duration: applyReducedMotion(125),
      onBegin: () => {
        textEl.classList.remove("hidden");
      },
    });
  } else if (Config.mode === "zen" || Config.timerStyle === "mini") {
    animate(miniEl, {
      opacity: [0, 1],
      duration: applyReducedMotion(125),
      onBegin: () => {
        miniEl.classList.remove("hidden");
      },
    });
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

  animate(barEl, {
    width,
    duration: 0,
  });
  miniEl.textContent = "0";
  textEl.textContent = "0";
}

export function hide(): void {
  animate(barOpacityEl, {
    opacity: 0,
    duration: applyReducedMotion(125),
  });

  animate(miniEl, {
    opacity: 0,
    duration: applyReducedMotion(125),
    onComplete: () => {
      miniEl.classList.add("hidden");
    },
  });

  animate(textEl, {
    opacity: 0,
    duration: applyReducedMotion(125),
    onComplete: () => {
      textEl.classList.add("hidden");
    },
  });
}

function getCurrentCount(): number {
  if (Config.mode === "custom" && CustomText.getLimitMode() === "section") {
    return (
      (TestWords.words.sectionIndexList[TestState.activeWordIndex] as number) -
      1
    );
  } else {
    return TestInput.input.getHistory().length;
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

      animate(barEl, {
        width: percent + "vw",
        duration: 1000,
        ease: "linear",
      });
    } else if (Config.timerStyle === "text") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      if (textEl !== null) {
        textEl.innerHTML = "<div>" + displayTime + "</div>";
      }
    } else if (Config.timerStyle === "flash") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      if (textEl !== null) {
        textEl.innerHTML =
          "<div>" +
          `${parseInt(displayTime) % 15 !== 0 ? "" : displayTime}` +
          "</div>";
      }
    } else if (Config.timerStyle === "mini") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      if (miniEl !== null) {
        miniEl.innerHTML = displayTime;
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
        ((TestState.activeWordIndex + 1) / outof) * 100
      );

      animate(barEl, {
        width: percent + "vw",
        duration: 250,
      });
    } else if (Config.timerStyle === "text") {
      if (outof === 0) {
        textEl.innerHTML = `<div>${TestInput.input.getHistory().length}</div>`;
      } else {
        textEl.innerHTML = `<div>${getCurrentCount()}/${outof}</div>`;
      }
    } else if (Config.timerStyle === "flash") {
      if (outof === 0) {
        textEl.innerHTML = `<div>${TestInput.input.getHistory().length}</div>`;
      } else {
        textEl.innerHTML = `<div>${getCurrentCount()}/${outof}</div>`;
      }
    } else if (Config.timerStyle === "mini") {
      if (outof === 0) {
        miniEl.innerHTML = `${TestInput.input.getHistory().length}`;
      } else {
        miniEl.innerHTML = `${getCurrentCount()}/${outof}`;
      }
    }
  } else if (Config.mode === "zen") {
    if (Config.timerStyle === "text") {
      textEl.innerHTML = `<div>${TestInput.input.getHistory().length}</div>`;
    } else if (Config.timerStyle === "flash") {
      textEl.innerHTML = `<div>${TestInput.input.getHistory().length}</div>`;
    } else {
      miniEl.innerHTML = `${TestInput.input.getHistory().length}`;
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
