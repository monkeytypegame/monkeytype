//TODO: use Format
import { Chart, type PluginChartOptions } from "chart.js";
import Config, { setConfig } from "../config";
import * as AdController from "../controllers/ad-controller";
import * as ChartController from "../controllers/chart-controller";
import QuotesController, { Quote } from "../controllers/quotes-controller";
import * as DB from "../db";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Notifications from "../elements/notifications";
import { isAuthenticated } from "../firebase";
import * as quoteRateModal from "../modals/quote-rate";
import * as GlarsesMode from "../states/glarses-mode";
import * as SlowTimer from "../states/slow-timer";
import * as DateTime from "../utils/date-and-time";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as Numbers from "@monkeytype/util/numbers";
import * as Arrays from "../utils/arrays";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as PbCrown from "./pb-crown";
import * as TestConfig from "./test-config";
import * as TestInput from "./test-input";
import * as TestStats from "./test-stats";
import * as TestUI from "./test-ui";
import * as TodayTracker from "./today-tracker";
import * as ConfigEvent from "../observables/config-event";
import * as Focus from "./focus";
import * as CustomText from "./custom-text";
import * as CustomTextState from "./../states/custom-text-name";
import * as Funbox from "./funbox/funbox";
import Format from "../utils/format";
import confetti from "canvas-confetti";
import type {
  AnnotationOptions,
  LabelPosition,
} from "chartjs-plugin-annotation";
import Ape from "../ape";
import { CompletedEvent } from "@monkeytype/schemas/results";
import { getActiveFunboxes, isFunboxActiveWithProperty } from "./funbox/list";
import { getFunbox } from "@monkeytype/funbox";
import { SnapshotUserTag } from "../constants/default-snapshot";
import { Language } from "@monkeytype/schemas/languages";
import { canQuickRestart as canQuickRestartFn } from "../utils/quick-restart";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { z } from "zod";
import * as TestState from "./test-state";
import { blurInputElement } from "../input/input-element";
import * as ConnectionState from "../states/connection";
import { currentQuote } from "./test-words";
import { qs, qsa } from "../utils/dom";
import { getTheme } from "../signals/theme";

let result: CompletedEvent;
let minChartVal: number;
let maxChartVal: number;

let useSmoothedBurst = true;
let useFakeChartData = false;

let quoteLang: Language | undefined;
let quoteId = "";

export function toggleSmoothedBurst(): void {
  useSmoothedBurst = !useSmoothedBurst;
  Notifications.add(useSmoothedBurst ? "on" : "off", 1);
  if (TestState.resultVisible) {
    void updateChartData().then(() => {
      ChartController.result.update("resize");
    });
  }
}

export function toggleUserFakeChartData(): void {
  useFakeChartData = !useFakeChartData;
  Notifications.add(useFakeChartData ? "on" : "off", 1);
  if (TestState.resultVisible) {
    void updateChartData().then(() => {
      ChartController.result.update("resize");
    });
  }
}

let resultAnnotation: AnnotationOptions<"line">[] = [];

async function updateChartData(): Promise<void> {
  if (result.chartData === "toolong") {
    ChartController.result.getDataset("wpm").data = [];
    ChartController.result.getDataset("raw").data = [];
    ChartController.result.getDataset("burst").data = [];
    ChartController.result.getDataset("error").data = [];
    return;
  }

  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  ChartController.result.getScale("wpm").title.text =
    typingSpeedUnit.fullUnitString;

  let labels = [];

  for (let i = 1; i <= TestInput.wpmHistory.length; i++) {
    if (TestStats.lastSecondNotRound && i === TestInput.wpmHistory.length) {
      labels.push(Numbers.roundTo2(result.testDuration).toString());
    } else {
      labels.push(i.toString());
    }
  }

  const chartData1 = [
    ...result.chartData.wpm.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  const chartData2 = [
    ...TestInput.rawHistory.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  const valueWindow = Math.max(...result.chartData.burst) * 0.25;
  let smoothedBurst = Arrays.smoothWithValueWindow(
    result.chartData.burst,
    1,
    useSmoothedBurst ? valueWindow : 0,
  );

  const chartData3 = [
    ...smoothedBurst.map((a) => Numbers.roundTo2(typingSpeedUnit.fromWpm(a))),
  ];

  if (
    Config.mode !== "time" &&
    TestStats.lastSecondNotRound &&
    result.testDuration % 1 < 0.5
  ) {
    labels.pop();
    chartData1.pop();
    chartData2.pop();
  }

  const subcolor = getTheme().sub;

  if (Config.funbox.length > 0) {
    let content = "";
    for (const fb of getActiveFunboxes()) {
      content += fb.name;
      if (fb.functions?.getResultContent) {
        content += "(" + fb.functions.getResultContent() + ")";
      }
      content += " ";
    }
    content = content.trimEnd();
    resultAnnotation.push({
      display: true,
      id: "funbox-label",
      type: "line",
      scaleID: "wpm",
      value: ChartController.result.getScale("wpm").min,
      borderColor: "transparent",
      borderWidth: 1,
      borderDash: [2, 2],
      label: {
        backgroundColor: "transparent",
        font: {
          family: Config.fontFamily.replace(/_/g, " "),
          size: 11,
          style: "normal",
          weight: Chart.defaults.font.weight as string,
          lineHeight: Chart.defaults.font.lineHeight as number,
        },
        color: subcolor,
        padding: 3,
        borderRadius: 3,
        position: "start",
        display: true,
        content: `${content}`,
      },
    });
  }

  ChartController.result.data.labels = labels;

  ChartController.result.getDataset("wpm").data = chartData1;
  ChartController.result.getDataset("wpm").label = Config.typingSpeedUnit;

  ChartController.result.getDataset("raw").data = chartData2;

  ChartController.result.getDataset("burst").data = chartData3;

  ChartController.result.getDataset("error").data = result.chartData.err;
  ChartController.result.getScale("error").max = Math.max(
    ...result.chartData.err,
  );

  if (useFakeChartData) {
    applyFakeChartData();
  }
}

function applyFakeChartData(): void {
  const fakeChartData = {
    wpm: [
      108, 120, 116, 114, 113, 120, 118, 121, 119, 120, 116, 118, 113, 110, 108,
      110, 107, 107, 108, 109, 110, 112, 114, 112, 111, 109, 110, 108, 108, 109,
    ],
    raw: [
      108, 120, 116, 114, 113, 120, 123, 127, 131, 131, 131, 132, 130, 133, 134,
      134, 131, 129, 129, 128, 129, 130, 131, 129, 129, 127, 127, 128, 127, 127,
    ],
    burst: [
      108, 132, 108, 108, 108, 156, 144, 156, 156, 132, 132, 144, 108, 168, 156,
      132, 96, 108, 120, 120, 144, 156, 144, 84, 132, 84, 132, 156, 108, 120,
    ],
    err: [
      0, 0, 0, 0, 0, 0, 3, 1, 3, 0, 5, 0, 3, 5, 4, 0, 2, 0, 0, 0, 0, 0, 0, 1, 2,
      1, 0, 4, 0, 0,
    ],
  };

  const labels = fakeChartData.wpm.map((_, i) => (i + 1).toString());

  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);

  const chartData1 = [
    ...fakeChartData.wpm.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  const chartData2 = [
    ...fakeChartData.raw.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  const chartData3 = [
    ...fakeChartData.burst.map((a) =>
      Numbers.roundTo2(typingSpeedUnit.fromWpm(a)),
    ),
  ];

  maxChartVal = Math.max(
    ...[
      Math.max(...chartData1),
      Math.max(...chartData2),
      Math.max(...chartData3),
    ],
  );

  let minChartVal = 0;

  if (!Config.startGraphsAtZero) {
    minChartVal = Math.min(
      ...[
        Math.min(...chartData1),
        Math.min(...chartData2),
        Math.min(...chartData3),
      ],
    );

    // Round down to nearest multiple of 10
    minChartVal = Math.floor(minChartVal / 10) * 10;
  }

  ChartController.result.data.labels = labels;

  ChartController.result.getDataset("wpm").data = chartData1;
  ChartController.result.getDataset("wpm").label = Config.typingSpeedUnit;
  ChartController.result.getScale("wpm").min = minChartVal;
  ChartController.result.getScale("wpm").max = maxChartVal;

  ChartController.result.getDataset("raw").data = chartData2;
  ChartController.result.getScale("raw").min = minChartVal;
  ChartController.result.getScale("raw").max = maxChartVal;

  ChartController.result.getDataset("burst").data = chartData3;
  ChartController.result.getScale("burst").min = minChartVal;
  ChartController.result.getScale("burst").max = maxChartVal;

  ChartController.result.getDataset("error").data = fakeChartData.err;
  ChartController.result.getScale("error").max = Math.max(...fakeChartData.err);
}

export async function updateChartPBLine(): Promise<void> {
  const themecolors = getTheme();
  const localPb = await DB.getLocalPB(
    result.mode,
    result.mode2,
    result.punctuation ?? false,
    result.numbers ?? false,
    result.language,
    result.difficulty,
    result.lazyMode ?? false,
    getFunbox(result.funbox),
  );
  const localPbWpm = localPb?.wpm ?? 0;
  if (localPbWpm === 0) return;
  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  const chartlpb = Numbers.roundTo2(
    typingSpeedUnit.fromWpm(localPbWpm),
  ).toFixed(2);
  resultAnnotation.push({
    display: true,
    type: "line",
    id: "lpb",
    scaleID: "wpm",
    value: chartlpb,
    borderColor: themecolors.sub + "55",
    borderWidth: 1,
    // borderDash: [4, 16],
    label: {
      backgroundColor: themecolors.sub,
      font: {
        family: Config.fontFamily.replace(/_/g, " "),
        size: 11,
        style: "normal",
        weight: Chart.defaults.font.weight as string,
        lineHeight: Chart.defaults.font.lineHeight as number,
      },
      color: themecolors.bg,
      padding: 3,
      borderRadius: 3,
      position: "center",
      content: ` PB: ${chartlpb} `,
      display: true,
    },
  });
}

function updateWpmAndAcc(): void {
  let inf = false;
  if (result.wpm >= 1000) {
    inf = true;
  }

  qs("#result .stats .wpm .top .text")?.setText(Config.typingSpeedUnit);

  if (inf) {
    qs("#result .stats .wpm .bottom")?.setText("Infinite");
  } else {
    qs("#result .stats .wpm .bottom")?.setText(Format.typingSpeed(result.wpm));
  }
  qs("#result .stats .raw .bottom")?.setText(Format.typingSpeed(result.rawWpm));
  qs("#result .stats .acc .bottom")?.setText(
    result.acc === 100 ? "100%" : Format.accuracy(result.acc),
  );

  if (Config.alwaysShowDecimalPlaces) {
    if (Config.typingSpeedUnit !== "wpm") {
      qs("#result .stats .wpm .bottom")?.setAttribute(
        "aria-label",
        result.wpm.toFixed(2) + " wpm",
      );
      qs("#result .stats .raw .bottom")?.setAttribute(
        "aria-label",
        result.rawWpm.toFixed(2) + " wpm",
      );
    } else {
      qs("#result .stats .wpm .bottom")?.removeAttribute("aria-label");
      qs("#result .stats .raw .bottom")?.removeAttribute("aria-label");
    }

    let time = Numbers.roundTo2(result.testDuration).toFixed(2) + "s";
    if (result.testDuration > 61) {
      time = DateTime.secondsToString(Numbers.roundTo2(result.testDuration));
    }
    qs("#result .stats .time .bottom .text")?.setText(time);
    // qs("#result .stats .acc .bottom")?.removeAttribute("aria-label");

    qs("#result .stats .acc .bottom")?.setAttribute(
      "aria-label",
      `${TestInput.accuracy.correct} correct\n${TestInput.accuracy.incorrect} incorrect`,
    );
  } else {
    //not showing decimal places
    const decimalsAndSuffix = {
      showDecimalPlaces: true,
      suffix: ` ${Config.typingSpeedUnit}`,
    };
    let wpmHover = Format.typingSpeed(result.wpm, decimalsAndSuffix);
    let rawWpmHover = Format.typingSpeed(result.rawWpm, decimalsAndSuffix);

    if (Config.typingSpeedUnit !== "wpm") {
      wpmHover += " (" + result.wpm.toFixed(2) + " wpm)";
      rawWpmHover += " (" + result.rawWpm.toFixed(2) + " wpm)";
    }

    qs("#result .stats .wpm .bottom")?.setAttribute("aria-label", wpmHover);
    qs("#result .stats .raw .bottom")?.setAttribute("aria-label", rawWpmHover);

    qs("#result .stats .acc .bottom")
      ?.setAttribute(
        "aria-label",
        `${
          result.acc === 100
            ? "100%"
            : Format.percentage(result.acc, { showDecimalPlaces: true })
        }\n${TestInput.accuracy.correct} correct\n${
          TestInput.accuracy.incorrect
        } incorrect`,
      )
      ?.setAttribute("data-balloon-break", "");
  }
}

function updateConsistency(): void {
  qs("#result .stats .consistency .bottom")?.setText(
    Format.percentage(result.consistency),
  );
  if (Config.alwaysShowDecimalPlaces) {
    qs("#result .stats .consistency .bottom")?.setAttribute(
      "aria-label",
      Format.percentage(result.keyConsistency, {
        showDecimalPlaces: true,
        suffix: " key",
      }),
    );
  } else {
    qs("#result .stats .consistency .bottom")?.setAttribute(
      "aria-label",
      `${result.consistency}% (${result.keyConsistency}% key)`,
    );
  }
}

function updateTime(): void {
  const afkSecondsPercent = Numbers.roundTo2(
    (result.afkDuration / result.testDuration) * 100,
  );
  qs("#result .stats .time .bottom .afk")?.setText("");
  if (afkSecondsPercent > 0) {
    qs("#result .stats .time .bottom .afk")?.setText(
      afkSecondsPercent + "% afk",
    );
  }
  qs("#result .stats .time .bottom")?.setAttribute(
    "aria-label",
    `${result.afkDuration}s afk ${afkSecondsPercent}%`,
  );

  if (Config.alwaysShowDecimalPlaces) {
    let time = Numbers.roundTo2(result.testDuration).toFixed(2) + "s";
    if (result.testDuration > 61) {
      time = DateTime.secondsToString(Numbers.roundTo2(result.testDuration));
    }
    qs("#result .stats .time .bottom .text")?.setText(time);
  } else {
    let time = Math.round(result.testDuration) + "s";
    if (result.testDuration > 61) {
      time = DateTime.secondsToString(Math.round(result.testDuration));
    }
    qs("#result .stats .time .bottom .text")?.setText(time);
    qs("#result .stats .time .bottom")?.setAttribute(
      "aria-label",
      `${Numbers.roundTo2(result.testDuration)}s (${
        result.afkDuration
      }s afk ${afkSecondsPercent}%)`,
    );
  }
}

export function updateTodayTracker(): void {
  qs("#result .stats .time .bottom .timeToday")?.setText(
    TodayTracker.getString(),
  );
}

function updateKey(): void {
  qs("#result .stats .key .bottom")?.setText(
    result.charStats[0] +
      "/" +
      result.charStats[1] +
      "/" +
      result.charStats[2] +
      "/" +
      result.charStats[3],
  );
}

export function showCrown(type: PbCrown.CrownType): void {
  PbCrown.show();
  PbCrown.update(type);
}

export function updateCrownText(text: string, wide = false): void {
  qs("#result .stats .wpm .crown")?.setAttribute("aria-label", text);
  qs("#result .stats .wpm .crown")?.setAttribute(
    "data-balloon-length",
    wide ? "medium" : "",
  );
}

export async function updateCrown(dontSave: boolean): Promise<void> {
  if (Config.mode === "quote" || dontSave) {
    hideCrown();
    return;
  }

  let pbDiff = 0;
  const canGetPb = await resultCanGetPb();

  console.debug("Result can get PB:", canGetPb.value, canGetPb.reason ?? "");

  if (canGetPb.value) {
    const localPb = await DB.getLocalPB(
      Config.mode,
      result.mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
      getActiveFunboxes(),
    );
    const localPbWpm = localPb?.wpm ?? 0;
    pbDiff = result.wpm - localPbWpm;
    console.debug("Local PB", localPb, "diff", pbDiff);
    if (pbDiff <= 0) {
      hideCrown();
      console.debug("Hiding crown");
    } else {
      //show half crown as the pb is not confirmed by the server
      console.debug("Showing pending crown");
      showCrown("pending");
      updateCrownText(
        "+" + Format.typingSpeed(pbDiff, { showDecimalPlaces: true }),
      );
    }
  } else {
    const localPb = await DB.getLocalPB(
      Config.mode,
      result.mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
      [],
    );
    const localPbWpm = localPb?.wpm ?? 0;
    pbDiff = result.wpm - localPbWpm;
    console.debug("Local PB", localPb, "diff", pbDiff);
    if (pbDiff <= 0) {
      // hideCrown();
      console.debug("Showing warning crown");
      showCrown("warning");
      updateCrownText(
        `This result is not eligible for a new PB (${canGetPb.reason})`,
        true,
      );
    } else {
      console.debug("Showing ineligible crown");
      showCrown("ineligible");
      updateCrownText(
        `You could've gotten a new PB (+${Format.typingSpeed(pbDiff, {
          showDecimalPlaces: true,
        })}), but your config does not allow it (${canGetPb.reason})`,
        true,
      );
    }
  }
}

export function hideCrown(): void {
  PbCrown.hide();
  updateCrownText("");
}

export function showErrorCrownIfNeeded(): void {
  if (PbCrown.getCurrentType() !== "pending") return;
  PbCrown.show();
  PbCrown.update("error");
  updateCrownText(
    `Local PB data is out of sync with the server - please refresh (pb mismatch)`,
    true,
  );
}

type CanGetPbObject = {
  value: boolean;
  reason?: string;
};

async function resultCanGetPb(): Promise<CanGetPbObject> {
  const funboxes = result.funbox;
  const funboxObjects = getFunbox(result.funbox);
  const allFunboxesCanGetPb = funboxObjects.every((f) => f?.canGetPb);

  const funboxesOk = funboxes.length === 0 || allFunboxesCanGetPb;
  // allow stopOnError:letter to be PB only if 100% accuracy, since it doesn't affect gameplay
  const stopOnLetterTriggered =
    Config.stopOnError === "letter" && result.acc < 100;
  const notBailedOut = !result.bailedOut;

  if (funboxesOk && !stopOnLetterTriggered && notBailedOut) {
    return {
      value: true,
    };
  } else {
    if (!funboxesOk) {
      return {
        value: false,
        reason: "funbox",
      };
    }
    if (stopOnLetterTriggered) {
      return {
        value: false,
        reason: "stop on letter",
      };
    }
    if (!notBailedOut) {
      return {
        value: false,
        reason: "bailed out",
      };
    }
    return {
      value: false,
      reason: "unknown",
    };
  }
}

export function showConfetti(): void {
  if (SlowTimer.get()) return;
  const style = getComputedStyle(document.body);
  const colors = [
    style.getPropertyValue("--main-color"),
    style.getPropertyValue("--text-color"),
    style.getPropertyValue("--sub-color"),
  ];
  const duration = Date.now() + 125;

  (function f(): void {
    void confetti({
      particleCount: 5,
      angle: 60,
      spread: 75,
      origin: { x: 0 },
      colors: colors,
    });
    void confetti({
      particleCount: 5,
      angle: 120,
      spread: 75,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < duration) {
      requestAnimationFrame(f);
    }
  })();
}

async function updateTags(dontSave: boolean): Promise<void> {
  const activeTags: SnapshotUserTag[] = [];
  const userTagsCount = DB.getSnapshot()?.tags?.length ?? 0;
  try {
    DB.getSnapshot()?.tags?.forEach((tag) => {
      if (tag.active === true) {
        activeTags.push(tag);
      }
    });
  } catch (e) {}

  if (userTagsCount === 0) {
    qs("#result .stats .tags")?.hide();
  } else {
    qs("#result .stats .tags")?.show();
  }
  if (activeTags.length === 0) {
    qs("#result .stats .tags .bottom")?.setHtml(
      "<div class='noTags'>no tags</div>",
    );
  } else {
    qs("#result .stats .tags .bottom")?.setText("");
  }
  qs("#result .stats .tags .editTagsButton")?.setAttribute(
    "data-result-id",
    "",
  );
  qs("#result .stats .tags .editTagsButton")?.setAttribute(
    "data-active-tag-ids",
    activeTags.map((t) => t._id).join(","),
  );
  qs("#result .stats .tags .editTagsButton")?.addClass("invisible");

  let annotationSide: LabelPosition = "start";
  let labelAdjust = 15;
  for (const tag of activeTags) {
    const tpb = await DB.getLocalTagPB(
      tag._id,
      Config.mode,
      result.mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
    );
    qs("#result .stats .tags .bottom")?.appendHtml(`
      <div tagid="${tag._id}" aria-label="PB: ${tpb}" data-balloon-pos="up">${tag.display}<i class="fas fa-crown hidden"></i></div>
    `);
    const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
    if (
      Config.mode !== "quote" &&
      !dontSave &&
      (await resultCanGetPb()).value
    ) {
      if (tpb < result.wpm) {
        //new pb for that tag
        await DB.saveLocalTagPB(
          tag._id,
          Config.mode,
          result.mode2,
          Config.punctuation,
          Config.numbers,
          Config.language,
          Config.difficulty,
          Config.lazyMode,
          result.wpm,
          result.acc,
          result.rawWpm,
          result.consistency,
        );
        qs(`#result .stats .tags .bottom div[tagid="${tag._id}"] .fas`)?.show();
        qs(
          `#result .stats .tags .bottom div[tagid="${tag._id}"]`,
        )?.setAttribute("aria-label", "+" + Numbers.roundTo2(result.wpm - tpb));
        // console.log("new pb for tag " + tag.display);
      } else {
        const themecolors = getTheme();
        resultAnnotation.push({
          display: true,
          type: "line",
          id: "tpb",
          scaleID: "wpm",
          value: typingSpeedUnit.fromWpm(tpb),
          borderColor: themecolors.sub + "55",
          borderWidth: 1,
          // borderDash: [4, 16],
          label: {
            backgroundColor: themecolors.sub,
            font: {
              family: Config.fontFamily.replace(/_/g, " "),
              size: 11,
              style: "normal",
              weight: Chart.defaults.font.weight as string,
              lineHeight: Chart.defaults.font.lineHeight as number,
            },
            color: themecolors.bg,
            padding: 3,
            borderRadius: 3,
            position: annotationSide,
            xAdjust: labelAdjust,
            display: true,
            content: `${tag.display} PB: ${Numbers.roundTo2(
              typingSpeedUnit.fromWpm(tpb),
            ).toFixed(2)}`,
          },
        });
        if (annotationSide === "start") {
          annotationSide = "end";
          labelAdjust = -15;
        } else {
          annotationSide = "start";
          labelAdjust = 15;
        }
      }
    }
  }
}

function updateTestType(randomQuote: Quote | null): void {
  let testType = "";

  testType += Config.mode;

  if (Config.mode === "time") {
    testType += " " + Config.time;
  } else if (Config.mode === "words") {
    testType += " " + Config.words;
  } else if (Config.mode === "quote") {
    if (randomQuote?.group !== undefined) {
      testType += " " + ["short", "medium", "long", "thicc"][randomQuote.group];
    }
  }
  const ignoresLanguage = isFunboxActiveWithProperty("ignoresLanguage");
  if (Config.mode !== "custom" && !ignoresLanguage) {
    testType += "<br>" + Strings.getLanguageDisplayString(result.language);
  }
  if (Config.punctuation) {
    testType += "<br>punctuation";
  }
  if (Config.numbers) {
    testType += "<br>numbers";
  }
  if (Config.blindMode) {
    testType += "<br>blind";
  }
  if (Config.lazyMode) {
    testType += "<br>lazy";
  }
  if (Config.funbox.length > 0) {
    testType +=
      "<br>" + Config.funbox.map((it) => it.replace(/_/g, " ")).join(", ");
  }
  if (Config.difficulty === "expert") {
    testType += "<br>expert";
  } else if (Config.difficulty === "master") {
    testType += "<br>master";
  }
  if (Config.stopOnError !== "off") {
    testType += `<br>stop on ${Config.stopOnError}`;
  }

  qsa("#result .stats .testType .bottom")?.setHtml(testType);
}

function updateOther(
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
): void {
  let otherText = "";
  if (difficultyFailed) {
    otherText += `<br>failed (${failReason})`;
  }
  if (afkDetected) {
    otherText += "<br>afk detected";
  }
  if (TestStats.invalid) {
    otherText += "<br>invalid";
    const extra: string[] = [];
    if (
      result.wpm < 0 ||
      (result.wpm > 350 && result.mode !== "words" && result.mode2 !== "10") ||
      (result.wpm > 420 && result.mode === "words" && result.mode2 === "10")
    ) {
      extra.push("wpm");
    }
    if (
      result.rawWpm < 0 ||
      (result.rawWpm > 350 &&
        result.mode !== "words" &&
        result.mode2 !== "10") ||
      (result.rawWpm > 420 && result.mode === "words" && result.mode2 === "10")
    ) {
      extra.push("raw");
    }
    if (result.acc < 75 || result.acc > 100) {
      extra.push("accuracy");
    }
    if (extra.length > 0) {
      otherText += ` (${extra.join(",")})`;
    }
  }
  if (isRepeated) {
    otherText += "<br>repeated";
  }
  if (result.bailedOut) {
    otherText += "<br>bailed out";
  }
  if (tooShort) {
    otherText += "<br>too short";
  }

  if (otherText === "") {
    qs("#result .stats .info")?.hide();
  } else {
    qs("#result .stats .info")?.show();
    otherText = otherText.substring(4);
    qs("#result .stats .info .bottom")?.setHtml(otherText);
  }
}

export function updateRateQuote(randomQuote: Quote | null): void {
  if (Config.mode === "quote") {
    if (randomQuote === null) {
      console.error(
        "Failed to update quote rating button: randomQuote is null",
      );
      return;
    }

    const userqr =
      DB.getSnapshot()?.quoteRatings?.[randomQuote.language]?.[randomQuote.id];
    if (Numbers.isSafeNumber(userqr)) {
      qs(".pageTest #result #rateQuoteButton .icon")
        ?.removeClass("far")
        ?.addClass("fas");
    }
    quoteRateModal
      .getQuoteStats(randomQuote)
      .then((quoteStats) => {
        qs(".pageTest #result #rateQuoteButton .rating")?.setText(
          quoteStats?.average?.toFixed(1) ?? "",
        );
      })
      .catch((_e: unknown) => {
        qs(".pageTest #result #rateQuoteButton .rating")?.setText("?");
      });
    qs(".pageTest #result #rateQuoteButton")
      ?.setStyle({ opacity: "0" })
      ?.show()
      ?.setStyle({ opacity: "1" });
  }
}

function updateQuoteFavorite(randomQuote: Quote | null): void {
  const icon = qs(".pageTest #result #favoriteQuoteButton .icon");

  if (Config.mode !== "quote" || !isAuthenticated()) {
    icon?.getParent()?.hide();
    return;
  }

  if (randomQuote === null) {
    console.error(
      "Failed to update quote favorite button: randomQuote is null",
    );
    return;
  }

  quoteLang = Config.mode === "quote" ? randomQuote.language : undefined;
  quoteId = Config.mode === "quote" ? randomQuote.id.toString() : "";

  const userFav = QuotesController.isQuoteFavorite(randomQuote);
  icon?.removeClass(userFav ? "far" : "fas")?.addClass(userFav ? "fas" : "far");
  icon?.getParent()?.show();
}

function updateQuoteSource(randomQuote: Quote | null): void {
  if (Config.mode === "quote") {
    qs("#result .stats .source")?.show();
    qs("#result .stats .source .bottom")?.setHtml(
      randomQuote?.source ?? "Error: Source unknown",
    );
  } else {
    qs("#result .stats .source")?.hide();
  }
}

export async function update(
  res: CompletedEvent,
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
  randomQuote: Quote | null,
  dontSave: boolean,
): Promise<void> {
  resultAnnotation = [];
  result = structuredClone(res);
  hideCrown();
  qs("#resultWordsHistory .words")?.empty();
  qs("#result #resultWordsHistory")?.hide();
  qs("#result #replayStats")?.setText("");
  qs("#result #resultReplay")?.hide();
  qs("#result #replayWords")?.empty();
  qs("#retrySavingResultButton")?.hide();
  qs(".pageTest #result #rateQuoteButton .icon")
    ?.removeClass("fas")
    ?.addClass("far");
  qs(".pageTest #result #rateQuoteButton .rating")?.setText("");
  qs(".pageTest #result #rateQuoteButton")?.hide();
  qs("#words")?.removeClass("blurred");
  blurInputElement();
  qs("#result .stats .time .bottom .afk")?.setText("");
  if (isAuthenticated()) {
    qs("#result .loginTip")?.hide();
  } else {
    qs("#result .loginTip")?.show();
  }
  if (Config.ads === "off" || Config.ads === "result") {
    qs("#result #watchVideoAdButton")?.hide();
  } else {
    qs("#result #watchVideoAdButton")?.show();
  }

  if (!ConnectionState.get()) {
    ConnectionState.showOfflineBanner();
  }

  updateWpmAndAcc();
  updateConsistency();
  updateTime();
  updateKey();
  updateTestType(randomQuote);
  updateQuoteSource(randomQuote);
  updateQuoteFavorite(randomQuote);
  await updateCrown(dontSave);
  await updateChartData();
  updateResultChartDataVisibility();
  updateMinMaxChartValues();
  await updateChartPBLine();
  applyMinMaxChartValues();
  await updateTags(dontSave);
  updateOther(difficultyFailed, failReason, afkDetected, isRepeated, tooShort);

  ((ChartController.result.options as PluginChartOptions<"line" | "scatter">)
    .plugins.annotation.annotations as AnnotationOptions<"line">[]) =
    resultAnnotation;
  ChartController.result.resize();

  if (
    qs("#result .stats .tags")?.hasClass("hidden") &&
    qs("#result .stats .info")?.hasClass("hidden")
  ) {
    qs("#result .stats .infoAndTags")?.hide();
  } else {
    qs("#result .stats .infoAndTags")?.show();
  }

  if (GlarsesMode.get()) {
    qs("main #result .noStressMessage")?.remove();
    qs("main #result")?.prependHtml(`

      <div class='noStressMessage' style="
        text-align: center;
        grid-column: 1/3;
        font-size: 2rem;
        padding-bottom: 2rem;
      ">
      <i class="fas fa-check"></i>
      </div>

    `);
    qsa("main #result .stats")?.hide();
    qs("main #result .chart")?.hide();
    qs("main #result #resultWordsHistory")?.hide();
    qs("main #result #resultReplay")?.hide();
    qs("main #result .loginTip")?.hide();
    qs("main #result #showWordHistoryButton")?.hide();
    qs("main #result #watchReplayButton")?.hide();
    qs("main #result #saveScreenshotButton")?.hide();

    console.log(
      `Test Completed: ${result.wpm} wpm ${result.acc}% acc ${result.rawWpm} raw ${result.consistency}% consistency`,
    );
  } else {
    qsa("main #result .stats")?.show();
    qs("main #result .chart")?.show();
    if (!isAuthenticated()) {
      qs("main #result .loginTip")?.show();
      qs("main #result #rateQuoteButton")?.hide();
      qs("main #result #reportQuoteButton")?.hide();
    } else {
      updateRateQuote(currentQuote);
      qs("main #result #reportQuoteButton")?.show();
    }
    qs("main #result .stats .dailyLeaderboard")?.hide();
    qs("main #result #showWordHistoryButton")?.show();
    qs("main #result #watchReplayButton")?.show();
    qs("main #result #saveScreenshotButton")?.show();
  }

  if (res.wpm === 0 && !difficultyFailed && res.testDuration >= 5) {
    const roundedTime = Math.round(res.testDuration);

    const messages = [
      `Congratulations. You just wasted ${roundedTime} seconds of your life by typing nothing. Be proud of yourself.`,
      `Bravo! You've managed to waste ${roundedTime} seconds and accomplish exactly zero. A true productivity icon.`,
      `That was ${roundedTime} seconds of absolutely legendary idleness. History will remember this moment.`,
      `Wow, ${roundedTime} seconds of typing... nothing. Bold. Mysterious. Completely useless.`,
      `Thank you for those ${roundedTime} seconds of utter nothingness. The keyboard needed the break.`,
      `A breathtaking display of inactivity. ${roundedTime} seconds of absolutely nothing. Powerful.`,
      `You just gave ${roundedTime} seconds of your life to the void. And the void says thanks.`,
      `Stunning. ${roundedTime} seconds of intense... whatever that wasn't. Keep it up, champ.`,
      `Is it performance art? A protest? Or just ${roundedTime} seconds of glorious nothing? We may never know.`,
      `You typed nothing for ${roundedTime} seconds. And in that moment, you became legend.`,
    ];

    showConfetti();
    Notifications.add(Arrays.randomElementFromArray(messages), 0, {
      customTitle: "Nice",
      duration: 15,
      important: true,
    });
  }

  TestConfig.hide();
  Focus.set(false);

  const canQuickRestart = canQuickRestartFn(
    Config.mode,
    Config.words,
    Config.time,
    CustomText.getData(),
    CustomTextState.isCustomTextLong() ?? false,
  );

  if (Config.alwaysShowWordsHistory && canQuickRestart && !GlarsesMode.get()) {
    void TestUI.toggleResultWords(true);
  }
  AdController.updateFooterAndVerticalAds(true);
  void Funbox.clear();

  qs(".pageTest .loading")?.hide();
  qs("#result")?.show();

  const resultEl = qs("#result");
  resultEl?.focus({
    preventScroll: true,
  });

  await Misc.promiseAnimate("#result", {
    opacity: [0, 1],
    duration: Misc.applyReducedMotion(125),
  });

  Misc.scrollToCenterOrTop(resultEl?.native ?? null);
  void AdController.renderResult();
  TestUI.setResultCalculating(false);
  qs("#words")?.empty();
  ChartController.result.resize();
}

const resultChartDataVisibility = new LocalStorageWithSchema({
  key: "resultChartDataVisibility",
  schema: z
    .object({
      raw: z.boolean(),
      burst: z.boolean(),
      errors: z.boolean(),
      pbLine: z.boolean(),
      tagPbLine: z.boolean(),
    })
    .strict(),
  fallback: {
    raw: true,
    burst: true,
    errors: true,
    pbLine: true,
    tagPbLine: true,
  },
});

function updateMinMaxChartValues(): void {
  const values = [];

  const datasets = {
    wpm: ChartController.result.getDataset("wpm"),
    burst: ChartController.result.getDataset("burst"),
    raw: ChartController.result.getDataset("raw"),
  };

  if (!datasets.wpm.hidden) {
    values.push(...datasets.wpm.data);
  }
  if (!datasets.burst.hidden) {
    values.push(...datasets.burst.data);
  }
  if (!datasets.raw.hidden) {
    values.push(...datasets.raw.data);
  }

  maxChartVal = Math.max(...values);

  let maxAnnotation: null | number = null;
  for (const annotation of resultAnnotation) {
    if ((annotation.display ?? false) === false) continue;
    if (annotation.value === undefined) continue;
    // values.push(annotation.value as number);
    if (
      maxAnnotation === null ||
      parseFloat(annotation.value as string) > maxAnnotation
    ) {
      maxAnnotation = parseFloat(annotation.value as string);
    }
  }

  if (maxAnnotation !== null) {
    const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
    const lpbRange = typingSpeedUnit.fromWpm(20);
    if (
      maxChartVal >= maxAnnotation - lpbRange &&
      maxChartVal <= maxAnnotation + lpbRange
    ) {
      maxChartVal = Math.round(maxAnnotation + lpbRange);
    }
  }

  maxChartVal = Math.ceil(maxChartVal / 10) * 10;

  minChartVal = 0;

  if (!Config.startGraphsAtZero) {
    minChartVal = Math.min(...values);

    // Round down to nearest multiple of 10
    minChartVal = Math.floor(minChartVal / 10) * 10;
  }
}

function applyMinMaxChartValues(): void {
  ChartController.result.getScale("wpm").min = minChartVal;
  ChartController.result.getScale("wpm").max = maxChartVal;
  ChartController.result.getScale("raw").min = minChartVal;
  ChartController.result.getScale("raw").max = maxChartVal;
  ChartController.result.getScale("burst").min = minChartVal;
  ChartController.result.getScale("burst").max = maxChartVal;
}

function updateResultChartDataVisibility(): void {
  const vis = resultChartDataVisibility.get();
  ChartController.result.getDataset("raw").hidden = !vis.raw;
  ChartController.result.getDataset("burst").hidden = !vis.burst;
  ChartController.result.getDataset("error").hidden = !vis.errors;

  for (const annotation of resultAnnotation) {
    if (annotation.id === "lpb") {
      annotation.display = vis.pbLine;
    } else if (annotation.id === "tpb") {
      annotation.display = vis.tagPbLine;
    }
  }

  const buttons = qsa(".pageTest #result .chart .chartLegend button");

  // Check if there are any tag PB annotations
  const hasTagPbAnnotations = resultAnnotation.some(
    (annotation) => annotation.id === "tpb",
  );

  for (const button of buttons) {
    const id = button?.getAttribute("data-id") as string;

    if (id === "scale") {
      continue;
    }

    if (
      id !== "raw" &&
      id !== "burst" &&
      id !== "errors" &&
      id !== "pbLine" &&
      id !== "tagPbLine"
    ) {
      continue;
    }

    button.toggleClass("active", vis[id]);

    if (id === "pbLine") {
      button.toggleClass("hidden", !isAuthenticated());
    } else if (id === "tagPbLine") {
      button.toggleClass("hidden", !isAuthenticated() || !hasTagPbAnnotations);
    }
  }
}

export function updateTagsAfterEdit(
  tagIds: string[],
  tagPbIds: string[],
): void {
  const tagNames: string[] = [];

  if (tagIds.length > 0) {
    for (const tag of tagIds) {
      DB.getSnapshot()?.tags?.forEach((snaptag) => {
        if (tag === snaptag._id) {
          tagNames.push(snaptag.display);
        }
      });
    }
  }

  if (tagIds.length === 0) {
    qs(`.pageTest #result .tags .bottom`)?.setHtml(
      "<div class='noTags'>no tags</div>",
    );
  } else {
    qs(`.pageTest #result .tags .bottom div.noTags`)?.remove();
    const currentElements = qsa(`.pageTest #result .tags .bottom div[tagid]`);

    const checked: string[] = [];
    currentElements.forEach((element) => {
      const tagId = element.getAttribute("tagid") ?? "";
      if (!tagIds.includes(tagId)) {
        element?.remove();
      } else {
        checked.push(tagId);
      }
    });

    let html = "";

    tagIds.forEach((tag, index) => {
      if (checked.includes(tag)) return;
      if (tagPbIds.includes(tag)) {
        html += `<div tagid="${tag}" data-balloon-pos="up">${tagNames[index]}<i class="fas fa-crown"></i></div>`;
      } else {
        html += `<div tagid="${tag}">${tagNames[index]}</div>`;
      }
    });

    // qs(`.pageTest #result .tags .bottom`)?.setHtml(tagNames.join("<br>"));
    qs(`.pageTest #result .tags .bottom`)?.appendHtml(html);
  }

  qs(`.pageTest #result .tags .top .editTagsButton`)?.setAttribute(
    "data-active-tag-ids",
    tagIds.join(","),
  );
}

qsa(".pageTest #result .chart .chartLegend button")?.on(
  "click",
  async (event) => {
    const $target = event.target as HTMLElement;
    const id = $target.getAttribute("data-id");

    if (id === "scale") {
      setConfig("startGraphsAtZero", !Config.startGraphsAtZero);
      return;
    }

    if (
      id !== "raw" &&
      id !== "burst" &&
      id !== "errors" &&
      id !== "pbLine" &&
      id !== "tagPbLine"
    ) {
      return;
    }
    const vis = resultChartDataVisibility.get();
    vis[id] = !vis[id];
    resultChartDataVisibility.set(vis);

    updateResultChartDataVisibility();
    updateMinMaxChartValues();
    applyMinMaxChartValues();
    ChartController.result.update();
  },
);

qs(".pageTest #favoriteQuoteButton")?.on("click", async () => {
  if (quoteLang === undefined || quoteId === "") {
    Notifications.add("Could not get quote stats!", -1);
    return;
  }

  const $button = qs(".pageTest #favoriteQuoteButton .icon");
  const dbSnapshot = DB.getSnapshot();
  if (!dbSnapshot) return;

  if ($button?.hasClass("fas")) {
    // Remove from
    showLoaderBar();
    const response = await Ape.users.removeQuoteFromFavorites({
      body: {
        language: quoteLang,
        quoteId,
      },
    });
    hideLoaderBar();

    Notifications.add(response.body.message, response.status === 200 ? 1 : -1);

    if (response.status === 200) {
      $button?.removeClass("fas")?.addClass("far");
      const quoteIndex = dbSnapshot.favoriteQuotes?.[quoteLang]?.indexOf(
        quoteId,
      ) as number;
      dbSnapshot.favoriteQuotes?.[quoteLang]?.splice(quoteIndex, 1);
    }
  } else {
    // Add to favorites
    showLoaderBar();
    const response = await Ape.users.addQuoteToFavorites({
      body: { language: quoteLang, quoteId },
    });
    hideLoaderBar();

    Notifications.add(response.body.message, response.status === 200 ? 1 : -1);

    if (response.status === 200) {
      $button?.removeClass("far")?.addClass("fas");
      dbSnapshot.favoriteQuotes ??= {};
      dbSnapshot.favoriteQuotes[quoteLang] ??= [];
      dbSnapshot.favoriteQuotes[quoteLang]?.push(quoteId);
    }
  }
});

ConfigEvent.subscribe(async ({ key }) => {
  if (
    ["typingSpeedUnit", "startGraphsAtZero"].includes(key) &&
    TestState.resultVisible
  ) {
    resultAnnotation = [];

    updateWpmAndAcc();
    await updateChartData();
    await updateChartPBLine();
    updateResultChartDataVisibility();
    updateMinMaxChartValues();
    applyMinMaxChartValues();
    void TestUI.applyBurstHeatmap();

    ((ChartController.result.options as PluginChartOptions<"line" | "scatter">)
      .plugins.annotation.annotations as AnnotationOptions<"line">[]) =
      resultAnnotation;
    ChartController.result.update();
    ChartController.result.resize();
  }
});
