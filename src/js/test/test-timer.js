//most of the code is thanks to
//https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript

import Config, * as UpdateConfig from "../config";
import * as CustomText from "./custom-text";
import * as TimerProgress from "./timer-progress";
import * as LiveWpm from "./live-wpm";
import * as TestStats from "./test-stats";
import * as Monkey from "./monkey";
import * as Misc from "../misc";
import * as Notifications from "../elements/notifications";
import * as TestLogic from "./test-logic";
import * as Caret from "./caret";

export let slowTimer = false;
let slowTimerCount = 0;
export let time = 0;
let timer = null;
const interval = 1000;
let expected = 0;

function setSlowTimer() {
  if (slowTimer) return;
  slowTimer = true;
  console.error("Slow timer, disabling animations");
  // Notifications.add("Slow timer detected", -1, 5);
}

function clearSlowTimer() {
  slowTimer = false;
  slowTimerCount = 0;
}

let timerDebug = false;
export function enableTimerDebug() {
  timerDebug = true;
}

export function clear() {
  time = 0;
  clearTimeout(timer);
}

function premid() {
  if (timerDebug) console.time("premid");
  document.querySelector("#premidSecondsLeft").innerHTML = Config.time - time;
  if (timerDebug) console.timeEnd("premid");
}

function updateTimer() {
  if (timerDebug) console.time("timer progress update");
  if (
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.isTimeRandom)
  ) {
    TimerProgress.update(time);
  }
  if (timerDebug) console.timeEnd("timer progress update");
}

function calculateWpmRaw() {
  if (timerDebug) console.time("calculate wpm and raw");
  let wpmAndRaw = TestLogic.calculateWpmAndRaw();
  if (timerDebug) console.timeEnd("calculate wpm and raw");
  if (timerDebug) console.time("update live wpm");
  LiveWpm.update(wpmAndRaw.wpm, wpmAndRaw.raw);
  if (timerDebug) console.timeEnd("update live wpm");
  if (timerDebug) console.time("push to history");
  TestStats.pushToWpmHistory(wpmAndRaw.wpm);
  TestStats.pushToRawHistory(wpmAndRaw.raw);
  if (timerDebug) console.timeEnd("push to history");
  return wpmAndRaw;
}

function monkey(wpmAndRaw) {
  if (timerDebug) console.time("update monkey");
  Monkey.updateFastOpacity(wpmAndRaw.wpm);
  if (timerDebug) console.timeEnd("update monkey");
}

function calculateAcc() {
  if (timerDebug) console.time("calculate acc");
  let acc = Misc.roundTo2(TestStats.calculateAccuracy());
  if (timerDebug) console.timeEnd("calculate acc");
  return acc;
}

function layoutfluid() {
  if (timerDebug) console.time("layoutfluid");
  if (Config.funbox === "layoutfluid" && Config.mode === "time") {
    const layouts = Config.customLayoutfluid
      ? Config.customLayoutfluid.split("#")
      : ["qwerty", "dvorak", "colemak"];
    // console.log(Config.customLayoutfluid);
    // console.log(layouts);
    const numLayouts = layouts.length;
    let index = 0;
    index = Math.floor(time / (Config.time / numLayouts));

    if (
      time == Math.floor(Config.time / numLayouts) - 3 ||
      time == (Config.time / numLayouts) * 2 - 3
    ) {
      Notifications.add("3", 0, 1);
    }
    if (
      time == Math.floor(Config.time / numLayouts) - 2 ||
      time == Math.floor(Config.time / numLayouts) * 2 - 2
    ) {
      Notifications.add("2", 0, 1);
    }
    if (
      time == Math.floor(Config.time / numLayouts) - 1 ||
      time == Math.floor(Config.time / numLayouts) * 2 - 1
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

function checkIfFailed(wpmAndRaw, acc) {
  if (timerDebug) console.time("fail conditions");
  TestStats.pushKeypressesToHistory();
  if (
    Config.minWpm === "custom" &&
    wpmAndRaw.wpm < parseInt(Config.minWpmCustomSpeed) &&
    TestLogic.words.currentIndex > 3
  ) {
    clearTimeout(timer);
    TestLogic.fail("min wpm");
    clearSlowTimer();
    return;
  }
  if (
    Config.minAcc === "custom" &&
    acc < parseInt(Config.minAccCustom) &&
    TestLogic.words.currentIndex > 3
  ) {
    clearTimeout(timer);
    TestLogic.fail("min accuracy");
    clearSlowTimer();
    return;
  }
  if (timerDebug) console.timeEnd("fail conditions");
}

function checkIfTimeIsUp() {
  if (timerDebug) console.time("times up check");
  if (
    Config.mode == "time" ||
    (Config.mode === "custom" && CustomText.isTimeRandom)
  ) {
    if (
      (time >= Config.time && Config.time !== 0 && Config.mode === "time") ||
      (time >= CustomText.time &&
        CustomText.time !== 0 &&
        Config.mode === "custom")
    ) {
      //times up
      clearTimeout(timer);
      Caret.hide();
      TestLogic.input.pushHistory();
      TestLogic.corrected.pushHistory();
      TestLogic.finish();
      clearSlowTimer();
      return;
    }
  }
  if (timerDebug) console.timeEnd("times up check");
}

// ---------------------------------------

let timerStats = [];

export function getTimerStats() {
  return timerStats;
}

async function timerStep() {
  if (timerDebug) console.time("timer step -----------------------------");
  time++;
  premid();
  updateTimer();
  let wpmAndRaw = calculateWpmRaw();
  let acc = calculateAcc();
  monkey(wpmAndRaw);
  layoutfluid();
  checkIfFailed(wpmAndRaw, acc);
  checkIfTimeIsUp();
  if (timerDebug) console.timeEnd("timer step -----------------------------");
}

export async function start() {
  clearSlowTimer();
  timerStats = [];
  expected = TestStats.start + interval;
  (function loop() {
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
        setSlowTimer();
      }
      if (delay < interval / 10) {
        slowTimerCount++;
        if (slowTimerCount > 5) {
          //slow timer
          Notifications.add(
            "Stopping the test due to bad performance. This would cause test calculations to be incorrect. If this happens a lot, please report this.",
            -1
          );
          TestLogic.fail("slow timer");
        }
      }
    }
    timer = setTimeout(function () {
      // time++;

      if (!TestLogic.active) {
        clearTimeout(timer);
        clearSlowTimer();
        return;
      }

      timerStep();

      expected += interval;
      loop();
    }, delay);
  })();
}
