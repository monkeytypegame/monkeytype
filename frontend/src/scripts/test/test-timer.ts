//most of the code is thanks to
//https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript

import Config, * as UpdateConfig from "../config";
import * as CustomText from "./custom-text";
import * as TimerProgress from "./timer-progress";
import * as LiveWpm from "./live-wpm";
import * as TestStats from "./test-stats";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import * as Monkey from "./monkey";
import * as Misc from "../misc";
import * as Notifications from "../elements/notifications";
import * as Caret from "./caret";
import * as SlowTimer from "../states/slow-timer";
import * as TestActive from "../states/test-active";
import * as Time from "../states/time";
import * as TimerEvent from "../observables/timer-event";

let slowTimerCount = 0;
let timer: NodeJS.Timeout | null = null;
const interval = 1000;
let expected = 0;

let timerDebug = false;
export function enableTimerDebug(): void {
  timerDebug = true;
}

export function clear(): void {
  Time.set(0);
  if (timer !== null) clearTimeout(timer);
}

function premid(): void {
  if (timerDebug) console.time("premid");
  const premidSecondsLeft = document.querySelector("#premidSecondsLeft");

  if (premidSecondsLeft !== null) {
    premidSecondsLeft.innerHTML = (Config.time - Time.get()).toString();
  }
  if (timerDebug) console.timeEnd("premid");
}

function updateTimer(): void {
  if (timerDebug) console.time("timer progress update");
  if (
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.isTimeRandom)
  ) {
    TimerProgress.update();
  }
  if (timerDebug) console.timeEnd("timer progress update");
}

function calculateWpmRaw(): MonkeyTypes.WordsPerMinuteAndRaw {
  if (timerDebug) console.time("calculate wpm and raw");
  const wpmAndRaw = TestStats.calculateWpmAndRaw();
  if (timerDebug) console.timeEnd("calculate wpm and raw");
  if (timerDebug) console.time("update live wpm");
  LiveWpm.update(wpmAndRaw.wpm, wpmAndRaw.raw);
  if (timerDebug) console.timeEnd("update live wpm");
  if (timerDebug) console.time("push to history");
  TestInput.pushToWpmHistory(wpmAndRaw.wpm);
  TestInput.pushToRawHistory(wpmAndRaw.raw);
  if (timerDebug) console.timeEnd("push to history");
  return wpmAndRaw;
}

function monkey(wpmAndRaw: MonkeyTypes.WordsPerMinuteAndRaw): void {
  if (timerDebug) console.time("update monkey");
  const num = Config.blindMode ? wpmAndRaw.raw : wpmAndRaw.wpm;
  Monkey.updateFastOpacity(num);
  if (timerDebug) console.timeEnd("update monkey");
}

function calculateAcc(): number {
  if (timerDebug) console.time("calculate acc");
  const acc = Misc.roundTo2(TestStats.calculateAccuracy());
  if (timerDebug) console.timeEnd("calculate acc");
  return acc;
}

function layoutfluid(): void {
  if (timerDebug) console.time("layoutfluid");
  if (Config.funbox === "layoutfluid" && Config.mode === "time") {
    const layouts = Config.customLayoutfluid
      ? Config.customLayoutfluid.split("#")
      : ["qwerty", "dvorak", "colemak"];
    // console.log(Config.customLayoutfluid);
    // console.log(layouts);
    const numLayouts = layouts.length;
    let index = 0;
    index = Math.floor(Time.get() / (Config.time / numLayouts));

    if (
      Time.get() == Math.floor(Config.time / numLayouts) - 3 ||
      Time.get() == (Config.time / numLayouts) * 2 - 3
    ) {
      Notifications.add("3", 0, 1);
    }
    if (
      Time.get() == Math.floor(Config.time / numLayouts) - 2 ||
      Time.get() == Math.floor(Config.time / numLayouts) * 2 - 2
    ) {
      Notifications.add("2", 0, 1);
    }
    if (
      Time.get() == Math.floor(Config.time / numLayouts) - 1 ||
      Time.get() == Math.floor(Config.time / numLayouts) * 2 - 1
    ) {
      Notifications.add("1", 0, 1);
    }

    if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
      Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
      UpdateConfig.setLayout(layouts[index], true);
      UpdateConfig.setKeymapLayout(layouts[index], true);
    }
  }
  if (timerDebug) console.timeEnd("layoutfluid");
}

function checkIfFailed(
  wpmAndRaw: MonkeyTypes.WordsPerMinuteAndRaw,
  acc: number
): void {
  if (timerDebug) console.time("fail conditions");
  TestInput.pushKeypressesToHistory();
  if (
    Config.minWpm === "custom" &&
    wpmAndRaw.wpm < Config.minWpmCustomSpeed &&
    TestWords.words.currentIndex > 3
  ) {
    if (timer !== null) clearTimeout(timer);
    SlowTimer.clear();
    slowTimerCount = 0;
    TimerEvent.dispatch("fail", "min wpm");
    return;
  }
  if (
    Config.minAcc === "custom" &&
    acc < Config.minAccCustom &&
    TestWords.words.currentIndex > 3
  ) {
    if (timer !== null) clearTimeout(timer);
    SlowTimer.clear();
    slowTimerCount = 0;
    TimerEvent.dispatch("fail", "min accuracy");
    return;
  }
  if (timerDebug) console.timeEnd("fail conditions");
}

function checkIfTimeIsUp(): void {
  if (timerDebug) console.time("times up check");
  if (
    Config.mode == "time" ||
    (Config.mode === "custom" && CustomText.isTimeRandom)
  ) {
    if (
      (Time.get() >= Config.time &&
        Config.time !== 0 &&
        Config.mode === "time") ||
      (Time.get() >= CustomText.time &&
        CustomText.time !== 0 &&
        Config.mode === "custom")
    ) {
      //times up
      if (timer !== null) clearTimeout(timer);
      Caret.hide();
      TestInput.input.pushHistory();
      TestInput.corrected.pushHistory();
      SlowTimer.clear();
      slowTimerCount = 0;
      TimerEvent.dispatch("finish");
      return;
    }
  }
  if (timerDebug) console.timeEnd("times up check");
}

// ---------------------------------------

let timerStats: MonkeyTypes.TimerStats[] = [];

export function getTimerStats(): MonkeyTypes.TimerStats[] {
  return timerStats;
}

async function timerStep(): Promise<void> {
  if (timerDebug) console.time("timer step -----------------------------");
  Time.increment();
  premid();
  updateTimer();
  const wpmAndRaw = calculateWpmRaw();
  const acc = calculateAcc();
  monkey(wpmAndRaw);
  layoutfluid();
  checkIfFailed(wpmAndRaw, acc);
  checkIfTimeIsUp();
  if (timerDebug) console.timeEnd("timer step -----------------------------");
}

export async function start(): Promise<void> {
  SlowTimer.clear();
  slowTimerCount = 0;
  timerStats = [];
  expected = TestStats.start + interval;
  (function loop(): void {
    const delay = expected - performance.now();
    timerStats.push({
      dateNow: Date.now(),
      now: performance.now(),
      expected: expected,
      nextDelay: delay,
    });
    if (
      (Config.mode === "time" && Config.time < 130 && Config.time > 0) ||
      (Config.mode === "words" && Config.words < 250 && Config.words > 0)
    ) {
      if (delay < interval / 2) {
        //slow timer
        SlowTimer.set();
      }
      if (delay < interval / 10) {
        slowTimerCount++;
        if (slowTimerCount > 5) {
          //slow timer

          if (window.navigator.userAgent.includes("Edg")) {
            Notifications.add(
              'This bad performance could be caused by "efficiency mode" on Microsoft Edge.'
            );
          }

          Notifications.add(
            "Stopping the test due to bad performance. This would cause test calculations to be incorrect. If this happens a lot, please report this.",
            -1
          );

          TimerEvent.dispatch("fail", "slow timer");
        }
      }
    }
    timer = setTimeout(function () {
      // time++;

      if (!TestActive.get()) {
        if (timer !== null) clearTimeout(timer);
        SlowTimer.clear();
        slowTimerCount = 0;
        return;
      }

      timerStep();

      expected += interval;
      loop();
    }, delay);
  })();
}
