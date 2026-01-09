import { createSignal } from "solid-js";
import { VisibilityAnimationOptions } from "../hooks/useVisibilityAnimation";
import * as Time from "../states/time";
import Config from "../config";
import * as CustomText from "../test/custom-text";
import * as DateTime from "../utils/date-and-time";
import * as TestWords from "../test/test-words";
import * as TestInput from "../test/test-input";
import * as TestState from "../test/test-state";

export const [getTestTime, setTestTime] = createSignal(0);
export const [getProgress, setLiveProgress] = createSignal("");
export const [getWpm, setLiveStatWpm] = createSignal("0");
export const [getAcc, setLiveStatAcc] = createSignal("100%");
export const [getBurst, setLiveStatBurst] = createSignal("0");

export const [statsVisible, setStatsVisible] =
  createSignal<VisibilityAnimationOptions>({
    visible: false,
    animate: true,
  });

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

export function updateProgressSignal(): void {
  const time = Time.get();
  if (
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time")
  ) {
    let maxtime = Config.time;
    if (Config.mode === "custom" && CustomText.getLimitMode() === "time") {
      maxtime = CustomText.getLimitValue();
    }
    if (Config.timerStyle === "text") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      setLiveProgress(displayTime);
    } else if (Config.timerStyle === "flash_mini") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      setLiveProgress(displayTime);
    } else if (Config.timerStyle === "flash_text") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      setLiveProgress(displayTime);
    } else if (Config.timerStyle === "mini") {
      let displayTime = DateTime.secondsToString(maxtime - time);
      if (maxtime === 0) {
        displayTime = DateTime.secondsToString(time);
      }
      setLiveProgress(displayTime);
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
    if (Config.timerStyle === "text") {
      if (outof === 0) {
        setLiveProgress(`${TestInput.input.getHistory().length}`);
      } else {
        setLiveProgress(`${getCurrentCount()}/${outof}`);
      }
    } else if (Config.timerStyle === "flash_mini") {
      if (outof === 0) {
        setLiveProgress(`${TestInput.input.getHistory().length}`);
      } else {
        setLiveProgress(`${getCurrentCount()}/${outof}`);
      }
    } else if (Config.timerStyle === "flash_text") {
      if (outof === 0) {
        setLiveProgress(`${TestInput.input.getHistory().length}`);
      } else {
        setLiveProgress(`${getCurrentCount()}/${outof}`);
      }
    } else if (Config.timerStyle === "mini") {
      if (outof === 0) {
        setLiveProgress(`${TestInput.input.getHistory().length}`);
      } else {
        setLiveProgress(`${getCurrentCount()}/${outof}`);
      }
    }
  } else if (Config.mode === "zen") {
    if (Config.timerStyle === "text") {
      setLiveProgress(`${TestInput.input.getHistory().length}`);
    } else if (Config.timerStyle === "flash_mini") {
      setLiveProgress(`${TestInput.input.getHistory().length}`);
    } else if (Config.timerStyle === "flash_text") {
      setLiveProgress(`${TestInput.input.getHistory().length}`);
    } else {
      setLiveProgress(`${TestInput.input.getHistory().length}`);
    }
  }
}
