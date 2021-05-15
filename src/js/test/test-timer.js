import Config, * as UpdateConfig from "./config";
import * as CustomText from "./custom-text";
import * as TimerProgress from "./timer-progress";
import * as LiveWpm from "./live-wpm";
import * as TestStats from "./test-stats";
import * as Monkey from "./monkey";
import * as Misc from "./misc";
import * as Notifications from "./notifications";
import * as Funbox from "./funbox";
import * as TestLogic from "./test-logic";
import * as Caret from "./caret";
import * as Keymap from "./keymap";
import * as Tribe from "./tribe";

export let time = 0;
let timer = null;
const stepIntervalMS = 1000;
let expected = 0;

export function clear() {
  time = 0;
  clearTimeout(timer);
}

export function start() {
  // (function loop(expectedStepEnd) {
  //   const delay = expectedStepEnd - Date.now();
  //   console.log('delaying timer step by ' + delay + 'ms');
  //   timer = setTimeout(function () {
  //     timerStep();
  //     loop(expectedStepEnd + stepIntervalMS);
  //   }, delay);
  // })(TestStats.start + stepIntervalMS);
  function loop() {
    let dt = Date.now() - expected;

    if (dt > stepIntervalMS) {
      Tribe.setNoAnim(true);
    }

    if (!TestLogic.active) {
      clearTimeout(timer);
      return;
    }

    timerStep();

    expected += stepIntervalMS;
    let delay = Math.max(0, stepIntervalMS - dt);
    console.log(`deltatime ${dt}ms`);
    setTimeout(loop, delay);
  }
  expected = TestStats.start + stepIntervalMS;
  setTimeout(loop, stepIntervalMS);
}

async function timerStep() {
  console.time("timer step");
  time++;
  console.time("premid");
  $(".pageTest #premidSecondsLeft").text(Config.time - time);
  console.timeEnd("premid");
  if (
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.isTimeRandom)
  ) {
    TimerProgress.update(time);
  }
  console.time("wpm");
  let wpmAndRaw = TestLogic.calculateWpmAndRaw();
  LiveWpm.update(wpmAndRaw.wpm, wpmAndRaw.raw);
  TestStats.pushToWpmHistory(wpmAndRaw.wpm);
  TestStats.pushToRawHistory(wpmAndRaw.raw);
  Monkey.updateFastOpacity(wpmAndRaw.wpm);
  console.timeEnd("wpm");

  console.time("acc");
  let acc = Misc.roundTo2(TestStats.calculateAccuracy());
  console.timeEnd("acc");

  console.time("prog");
  let progress = 0;
  if (Config.mode === "time") {
    progress = 100 - ((time + 1) / Config.time) * 100;
  } else {
    let outof = TestLogic.words.length;
    if (Config.mode === "words") {
      outof = Config.words;
    }
    progress = Math.floor((TestLogic.words.currentIndex / (outof - 1)) * 100);
  }
  console.timeEnd("prog");

  console.time("tribe1");
  Tribe.sendTestProgress(wpmAndRaw.wpm, wpmAndRaw.raw, acc, progress);
  console.timeEnd("tribe1");
  console.time("tribe2");

  Tribe.updateTribeDiff(wpmAndRaw.wpm);
  console.timeEnd("tribe2");

  if (
    Tribe.state >= 21 &&
    Tribe.state <= 28 &&
    time >= 5 &&
    TestLogic.input.current === "" &&
    TestLogic.input.getHistory().length === 0
  ) {
    TestLogic.finish();
  }
  console.time("funbox");
  if (Funbox.active === "layoutfluid" && Config.mode === "time") {
    const layouts = ["qwerty", "dvorak", "colemak"];
    let index = 0;
    index = Math.floor(time / (Config.time / 3));

    if (
      time == Math.floor(Config.time / 3) - 3 ||
      time == (Config.time / 3) * 2 - 3
    ) {
      Notifications.add("3", 0, 1);
    }
    if (
      time == Math.floor(Config.time / 3) - 2 ||
      time == Math.floor(Config.time / 3) * 2 - 2
    ) {
      Notifications.add("2", 0, 1);
    }
    if (
      time == Math.floor(Config.time / 3) - 1 ||
      time == Math.floor(Config.time / 3) * 2 - 1
    ) {
      Notifications.add("1", 0, 1);
    }

    if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
      Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
    }
    UpdateConfig.setLayout(layouts[index]);
    UpdateConfig.setKeymapLayout(layouts[index]);
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
  }
  console.timeEnd("funbox");

  TestStats.pushKeypressesToHistory();
  if (
    (Config.minWpm === "custom" &&
      wpmAndRaw.wpm < parseInt(Config.minWpmCustomSpeed) &&
      TestLogic.words.currentIndex > 3) ||
    (Config.minAcc === "custom" && acc < parseInt(Config.minAccCustom))
  ) {
    clearTimeout(timer);
    TestLogic.fail();
    return;
  }
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
      return;
    }
  }
  console.timeEnd("timer step");
  console.log("------------------");
}
