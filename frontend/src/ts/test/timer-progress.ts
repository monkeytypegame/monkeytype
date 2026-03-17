import Config from "../config";
import * as CustomText from "./custom-text";
import * as DateTime from "../utils/date-and-time";
import * as TestWords from "./test-words";
import * as TestInput from "./test-input";
import * as Time from "../states/time";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";
import { applyReducedMotion } from "../utils/misc";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { animate } from "animejs";

const barEl = document.querySelector("#barTimerProgress .bar") as HTMLElement;
const barOpacityEl = document.querySelector(
  "#barTimerProgress .opacityWrapper",
) as HTMLElement;
const textEl = document.querySelector(
  "#liveStatsTextTop .timerProgress",
) as HTMLElement;
const miniEl = document.querySelector("#liveStatsMini .time") as HTMLElement;

function showElement(el: HTMLElement): void {
  animate(el, {
    opacity: [0, 1],
    duration: applyReducedMotion(125),
    onBegin: () => {
      el.classList.remove("hidden");
    },
  });
}

export function show(): void {
  if (!TestState.isActive) return;
  requestDebouncedAnimationFrame("timer-progress.show", () => {
    if (Config.mode !== "zen" && Config.timerStyle === "bar") {
      showElement(barOpacityEl);
    } else if (
      Config.timerStyle === "text" ||
      Config.timerStyle === "flash_text"
    ) {
      showElement(textEl);
    } else if (
      Config.timerStyle === "mini" ||
      Config.timerStyle === "flash_mini"
    ) {
      showElement(miniEl);
    }
  });
}

export function reset(): void {
  requestDebouncedAnimationFrame("timer-progress.reset", () => {
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
  });
}

function hideElement(el: HTMLElement, hideOnComplete: boolean): void {
  const args = {
    opacity: 0,
    duration: applyReducedMotion(125),
  };

  animate(
    el,
    hideOnComplete
      ? {
          ...args,
          onComplete: () => {
            el.classList.add("hidden");
          },
        }
      : args,
  );
}

export function hide(): void {
  requestDebouncedAnimationFrame("timer-progress.hide", () => {
    hideElement(barOpacityEl, false);
    hideElement(miniEl, true);
    hideElement(textEl, true);
  });
}

export function instantHide(): void {
  barOpacityEl.style.opacity = "0";

  miniEl.classList.add("hidden");
  miniEl.style.opacity = "0";

  textEl.classList.add("hidden");
  textEl.style.opacity = "0";
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

function setTimerHtmlToInputLength(el: HTMLElement, wrapInDiv: boolean): void {
  let historyLength = `${TestInput.input.getHistory().length}`;

  if (wrapInDiv) {
    historyLength = `<div>${historyLength}</div>`;
  }

  el.innerHTML = historyLength;
}

function updateTimer(el: HTMLElement, outof: number, wrapInDiv: boolean): void {
  if (outof === 0) {
    setTimerHtmlToInputLength(el, wrapInDiv);
  } else {
    el.innerHTML = `${getCurrentCount()}/${outof}`;
  }
}

export function update(): void {
  requestDebouncedAnimationFrame("timer-progress.update", () => {
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
      } else if (Config.timerStyle === "flash_mini") {
        let displayTime = DateTime.secondsToString(maxtime - time);
        if (maxtime === 0) {
          displayTime = DateTime.secondsToString(time);
        }
        if (miniEl !== null) {
          if ((maxtime - time) % 15 !== 0) {
            miniEl.style.opacity = "0";
          } else {
            miniEl.style.opacity = "1";
          }
          miniEl.innerHTML = "<div>" + displayTime + "</div>";
        }
      } else if (Config.timerStyle === "flash_text") {
        let displayTime = DateTime.secondsToString(maxtime - time);
        if (maxtime === 0) {
          displayTime = DateTime.secondsToString(time);
        }
        if (textEl !== null) {
          textEl.innerHTML =
            "<div>" +
            `${(maxtime - time) % 15 !== 0 ? "" : displayTime}` +
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
          ((TestState.activeWordIndex + 1) / outof) * 100,
        );

        animate(barEl, {
          width: percent + "vw",
          duration: 250,
        });
      } else if (
        Config.timerStyle === "text" ||
        Config.timerStyle === "flash_text"
      ) {
        updateTimer(textEl, outof, true);
      } else if (
        Config.timerStyle === "mini" ||
        Config.timerStyle === "flash_mini"
      ) {
        updateTimer(miniEl, outof, false);
      }
    } else if (Config.mode === "zen") {
      if (Config.timerStyle === "text" || Config.timerStyle === "flash_text") {
        setTimerHtmlToInputLength(textEl, true);
      } else if (
        Config.timerStyle === "mini" ||
        Config.timerStyle === "flash_mini"
      ) {
        setTimerHtmlToInputLength(miniEl, false);
      }
    }
  });
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

ConfigEvent.subscribe(({ key }) => {
  if (key === "timerStyle") updateStyle();
});
