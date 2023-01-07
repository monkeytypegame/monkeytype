import * as TestUI from "./test-ui";
import Config from "../config";
import * as Misc from "../utils/misc";
import * as TestStats from "./test-stats";
import * as Keymap from "../elements/keymap";
import * as ChartController from "../controllers/chart-controller";
import * as ThemeColors from "../elements/theme-colors";
import * as DB from "../db";
import * as TodayTracker from "./today-tracker";
import * as PbCrown from "./pb-crown";
import * as QuoteRatePopup from "../popups/quote-rate-popup";
import * as GlarsesMode from "../states/glarses-mode";
import * as TestInput from "./test-input";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
import QuotesController from "../controllers/quotes-controller";
import * as AdController from "../controllers/ad-controller";
import * as TestConfig from "./test-config";
import { Chart } from "chart.js";
import { Auth } from "../firebase";
import * as SlowTimer from "../states/slow-timer";
import * as FunboxList from "./funbox/funbox-list";

// eslint-disable-next-line no-duplicate-imports -- need to ignore because eslint doesnt know what import type is
import type { PluginChartOptions, ScaleChartOptions } from "chart.js";
import type { AnnotationOptions } from "chartjs-plugin-annotation";
import Ape from "../ape";
import confetti from "canvas-confetti";

let result: MonkeyTypes.Result<MonkeyTypes.Mode>;
let maxChartVal: number;

let useUnsmoothedRaw = false;

let quoteLang = "";
let quoteId = "";

export function toggleUnsmoothedRaw(): void {
  useUnsmoothedRaw = !useUnsmoothedRaw;
  Notifications.add(useUnsmoothedRaw ? "on" : "off", 1);
}

let resultAnnotation: AnnotationOptions<"line">[] = [];
let resultScaleOptions = (
  ChartController.result.options as ScaleChartOptions<"line" | "scatter">
).scales;

async function updateGraph(): Promise<void> {
  const labels = [];
  for (let i = 1; i <= TestInput.wpmHistory.length; i++) {
    if (TestStats.lastSecondNotRound && i === TestInput.wpmHistory.length) {
      labels.push(Misc.roundTo2(result.testDuration).toString());
    } else {
      labels.push(i.toString());
    }
  }
  resultScaleOptions["wpm"].title.text = Config.alwaysShowCPM
    ? "Character per Minute"
    : "Words per Minute";
  const chartData1 = [
    ...(Config.alwaysShowCPM
      ? TestInput.wpmHistory.map((a) => a * 5)
      : TestInput.wpmHistory),
  ];

  if (result.chartData === "toolong") return;

  const chartData2 = [
    ...(Config.alwaysShowCPM
      ? result.chartData.raw.map((a) => a * 5)
      : result.chartData.raw),
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

  let smoothedRawData = chartData2;
  if (!useUnsmoothedRaw) {
    smoothedRawData = Misc.smooth(smoothedRawData, 1);
  }

  ChartController.result.data.labels = labels;
  ChartController.result.data.datasets[0].data = chartData1;
  ChartController.result.data.datasets[1].data = smoothedRawData;

  ChartController.result.data.datasets[0].label = Config.alwaysShowCPM
    ? "cpm"
    : "wpm";

  maxChartVal = Math.max(...[Math.max(...chartData2), Math.max(...chartData1)]);
  if (!Config.startGraphsAtZero) {
    const minChartVal = Math.min(
      ...[Math.min(...chartData2), Math.min(...chartData1)]
    );
    resultScaleOptions["wpm"].min = minChartVal;
    resultScaleOptions["raw"].min = minChartVal;
  } else {
    resultScaleOptions["wpm"].min = 0;
    resultScaleOptions["raw"].min = 0;
  }

  ChartController.result.data.datasets[2].data = result.chartData.err;

  const fc = await ThemeColors.get("sub");
  if (Config.funbox !== "none") {
    let content = "";
    for (const f of FunboxList.get(Config.funbox)) {
      content += f.name;
      if (f.functions?.getResultContent) {
        content += "(" + f.functions.getResultContent() + ")";
      }
      content += " ";
    }
    content = content.trimEnd();
    resultAnnotation.push({
      display: true,
      id: "funbox-label",
      type: "line",
      scaleID: "wpm",
      value: resultScaleOptions["wpm"].min,
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
        color: fc,
        padding: 3,
        borderRadius: 3,
        position: "start",
        enabled: true,
        content: `${content}`,
      },
    });
  }

  resultScaleOptions["wpm"].max = maxChartVal;
  resultScaleOptions["raw"].max = maxChartVal;
  resultScaleOptions["error"].max = Math.max(...result.chartData.err);
}

export async function updateGraphPBLine(): Promise<void> {
  const themecolors = await ThemeColors.getAll();
  const lpb = await DB.getLocalPB(
    result.mode,
    result.mode2,
    result.punctuation ?? false,
    result.language,
    result.difficulty,
    result.lazyMode ?? false,
    result.funbox ?? "none"
  );
  if (lpb == 0) return;
  const chartlpb = Misc.roundTo2(Config.alwaysShowCPM ? lpb * 5 : lpb).toFixed(
    2
  );
  resultAnnotation.push({
    display: true,
    type: "line",
    id: "lpb",
    scaleID: "wpm",
    value: chartlpb,
    borderColor: themecolors["sub"],
    borderWidth: 1,
    borderDash: [2, 2],
    label: {
      backgroundColor: themecolors["sub"],
      font: {
        family: Config.fontFamily.replace(/_/g, " "),
        size: 11,
        style: "normal",
        weight: Chart.defaults.font.weight as string,
        lineHeight: Chart.defaults.font.lineHeight as number,
      },
      color: themecolors["bg"],
      padding: 3,
      borderRadius: 3,
      position: "center",
      enabled: true,
      content: `PB: ${chartlpb}`,
    },
  });
  if (
    maxChartVal >= parseFloat(chartlpb) - 20 &&
    maxChartVal <= parseFloat(chartlpb) + 20
  ) {
    maxChartVal = parseFloat(chartlpb) + 15;
  }
  resultScaleOptions["wpm"].max = Math.round(maxChartVal + 5);
  resultScaleOptions["raw"].max = Math.round(maxChartVal + 5);
}

function updateWpmAndAcc(): void {
  let inf = false;
  if (result.wpm >= 1000) {
    inf = true;
  }
  if (Config.alwaysShowDecimalPlaces) {
    if (Config.alwaysShowCPM == false) {
      $("#result .stats .wpm .top .text").text("wpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(
          Misc.roundTo2(result.wpm).toFixed(2)
        );
      }
      $("#result .stats .raw .bottom").text(
        Misc.roundTo2(result.rawWpm).toFixed(2)
      );
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(result.wpm * 5).toFixed(2) + " cpm"
      );
    } else {
      $("#result .stats .wpm .top .text").text("cpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(
          Misc.roundTo2(result.wpm * 5).toFixed(2)
        );
      }
      $("#result .stats .raw .bottom").text(
        Misc.roundTo2(result.rawWpm * 5).toFixed(2)
      );
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(result.wpm).toFixed(2) + " wpm"
      );
    }

    $("#result .stats .acc .bottom").text(
      result.acc == 100 ? "100%" : Misc.roundTo2(result.acc).toFixed(2) + "%"
    );
    let time = Misc.roundTo2(result.testDuration).toFixed(2) + "s";
    if (result.testDuration > 61) {
      time = Misc.secondsToString(Misc.roundTo2(result.testDuration));
    }
    $("#result .stats .time .bottom .text").text(time);
    $("#result .stats .raw .bottom").removeAttr("aria-label");
    $("#result .stats .acc .bottom").removeAttr("aria-label");
  } else {
    //not showing decimal places
    if (Config.alwaysShowCPM == false) {
      $("#result .stats .wpm .top .text").text("wpm");
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        result.wpm + ` (${Misc.roundTo2(result.wpm * 5)} cpm)`
      );
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Math.round(result.wpm));
      }
      $("#result .stats .raw .bottom").text(Math.round(result.rawWpm));
      $("#result .stats .raw .bottom").attr("aria-label", result.rawWpm);
    } else {
      $("#result .stats .wpm .top .text").text("cpm");
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(result.wpm * 5) + ` (${Misc.roundTo2(result.wpm)} wpm)`
      );
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Math.round(result.wpm * 5));
      }
      $("#result .stats .raw .bottom").text(Math.round(result.rawWpm * 5));
      $("#result .stats .raw .bottom").attr("aria-label", result.rawWpm * 5);
    }

    $("#result .stats .acc .bottom").text(Math.floor(result.acc) + "%");
    $("#result .stats .acc .bottom").attr("aria-label", result.acc + "%");
  }
}

function updateConsistency(): void {
  if (Config.alwaysShowDecimalPlaces) {
    $("#result .stats .consistency .bottom").text(
      Misc.roundTo2(result.consistency).toFixed(2) + "%"
    );
    $("#result .stats .consistency .bottom").attr(
      "aria-label",
      `${result.keyConsistency.toFixed(2)}% key`
    );
  } else {
    $("#result .stats .consistency .bottom").text(
      Math.round(result.consistency) + "%"
    );
    $("#result .stats .consistency .bottom").attr(
      "aria-label",
      `${result.consistency}% (${result.keyConsistency}% key)`
    );
  }
}

function updateTime(): void {
  const afkSecondsPercent = Misc.roundTo2(
    (result.afkDuration / result.testDuration) * 100
  );
  $("#result .stats .time .bottom .afk").text("");
  if (afkSecondsPercent > 0) {
    $("#result .stats .time .bottom .afk").text(afkSecondsPercent + "% afk");
  }
  $("#result .stats .time .bottom").attr(
    "aria-label",
    `${result.afkDuration}s afk ${afkSecondsPercent}%`
  );
  if (Config.alwaysShowDecimalPlaces) {
    let time = Misc.roundTo2(result.testDuration).toFixed(2) + "s";
    if (result.testDuration > 61) {
      time = Misc.secondsToString(Misc.roundTo2(result.testDuration));
    }
    $("#result .stats .time .bottom .text").text(time);
  } else {
    let time = Math.round(result.testDuration) + "s";
    if (result.testDuration > 61) {
      time = Misc.secondsToString(Math.round(result.testDuration));
    }
    $("#result .stats .time .bottom .text").text(time);
    $("#result .stats .time .bottom").attr(
      "aria-label",
      `${Misc.roundTo2(result.testDuration)}s (${
        result.afkDuration
      }s afk ${afkSecondsPercent}%)`
    );
  }
}

export function updateTodayTracker(): void {
  $("#result .stats .time .bottom .timeToday").text(TodayTracker.getString());
}

function updateKey(): void {
  $("#result .stats .key .bottom").text(
    result.charStats[0] +
      "/" +
      result.charStats[1] +
      "/" +
      result.charStats[2] +
      "/" +
      result.charStats[3]
  );
}

export function showCrown(): void {
  PbCrown.show();
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
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 75,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
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

export function hideCrown(): void {
  PbCrown.hide();
  $("#result .stats .wpm .crown").attr("aria-label", "");
}

export async function updateCrown(): Promise<void> {
  let pbDiff = 0;
  const lpb = await DB.getLocalPB(
    Config.mode,
    result.mode2,
    Config.punctuation,
    Config.language,
    Config.difficulty,
    Config.lazyMode,
    Config.funbox
  );
  pbDiff = Math.abs(result.wpm - lpb);
  $("#result .stats .wpm .crown").attr(
    "aria-label",
    "+" + Misc.roundTo2(pbDiff)
  );
}

function updateTags(dontSave: boolean): void {
  const activeTags: MonkeyTypes.Tag[] = [];
  const userTagsCount = DB.getSnapshot()?.tags?.length ?? 0;
  try {
    DB.getSnapshot()?.tags?.forEach((tag) => {
      if (tag.active === true) {
        activeTags.push(tag);
      }
    });
  } catch (e) {}

  if (userTagsCount === 0) {
    $("#result .stats .tags").addClass("hidden");
  } else {
    $("#result .stats .tags").removeClass("hidden");
  }
  if (activeTags.length === 0) {
    $("#result .stats .tags .bottom").text("no tags");
  } else {
    $("#result .stats .tags .bottom").text("");
  }
  $("#result .stats .tags .editTagsButton").attr("result-id", "");
  $("#result .stats .tags .editTagsButton").attr(
    "active-tag-ids",
    activeTags.map((t) => t._id).join(",")
  );
  $("#result .stats .tags .editTagsButton").addClass("invisible");

  let annotationSide = "start";
  let labelAdjust = 15;
  activeTags.forEach(async (tag) => {
    const tpb = await DB.getLocalTagPB(
      tag._id,
      Config.mode,
      result.mode2,
      Config.punctuation,
      Config.language,
      Config.difficulty,
      Config.lazyMode
    );
    $("#result .stats .tags .bottom").append(`
      <div tagid="${tag._id}" aria-label="PB: ${tpb}" data-balloon-pos="up">${tag.display}<i class="fas fa-crown hidden"></i></div>
    `);
    if (Config.mode != "quote" && !dontSave) {
      if (tpb < result.wpm) {
        //new pb for that tag
        DB.saveLocalTagPB(
          tag._id,
          Config.mode,
          result.mode2,
          Config.punctuation,
          Config.language,
          Config.difficulty,
          Config.lazyMode,
          result.wpm,
          result.acc,
          result.rawWpm,
          result.consistency
        );
        $(
          `#result .stats .tags .bottom div[tagid="${tag._id}"] .fas`
        ).removeClass("hidden");
        $(`#result .stats .tags .bottom div[tagid="${tag._id}"]`).attr(
          "aria-label",
          "+" + Misc.roundTo2(result.wpm - tpb)
        );
        // console.log("new pb for tag " + tag.display);
      } else {
        const themecolors = await ThemeColors.getAll();
        resultAnnotation.push({
          display: true,
          type: "line",
          id: "tpb",
          scaleID: "wpm",
          value: Config.alwaysShowCPM ? tpb * 5 : tpb,
          borderColor: themecolors["sub"],
          borderWidth: 1,
          borderDash: [2, 2],
          label: {
            backgroundColor: themecolors["sub"],
            font: {
              family: Config.fontFamily.replace(/_/g, " "),
              size: 11,
              style: "normal",
              weight: Chart.defaults.font.weight as string,
              lineHeight: Chart.defaults.font.lineHeight as number,
            },
            color: themecolors["bg"],
            padding: 3,
            borderRadius: 3,
            position: annotationSide,
            xAdjust: labelAdjust,
            enabled: true,
            content: `${tag.display} PB: ${Misc.roundTo2(
              Config.alwaysShowCPM ? tpb * 5 : tpb
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
  });
}

function updateTestType(randomQuote: MonkeyTypes.Quote): void {
  let testType = "";

  testType += Config.mode;

  if (Config.mode === "time") {
    testType += " " + Config.time;
  } else if (Config.mode === "words") {
    testType += " " + Config.words;
  } else if (Config.mode === "quote") {
    if (randomQuote.group !== undefined) {
      testType += " " + ["short", "medium", "long", "thicc"][randomQuote.group];
    }
  }
  const ignoresLanguage =
    FunboxList.get(Config.funbox).find((f) =>
      f.properties?.includes("ignoresLanguage")
    ) !== undefined;
  if (Config.mode != "custom" && !ignoresLanguage) {
    testType += "<br>" + result.language.replace(/_/g, " ");
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
  if (Config.funbox !== "none") {
    testType += "<br>" + Config.funbox.replace(/_/g, " ").replace(/#/g, ", ");
  }
  if (Config.difficulty == "expert") {
    testType += "<br>expert";
  } else if (Config.difficulty == "master") {
    testType += "<br>master";
  }

  $("#result .stats .testType .bottom").html(testType);
}

function updateOther(
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean
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
    if (result.wpm < 0 || result.wpm > 350) {
      extra.push("wpm");
    }
    if (result.rawWpm < 0 || result.rawWpm > 350) {
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

  if (otherText == "") {
    $("#result .stats .info").addClass("hidden");
  } else {
    $("#result .stats .info").removeClass("hidden");
    otherText = otherText.substring(4);
    $("#result .stats .info .bottom").html(otherText);
  }
}

export function updateRateQuote(randomQuote: MonkeyTypes.Quote): void {
  if (Config.mode === "quote") {
    const userqr =
      DB.getSnapshot()?.quoteRatings?.[randomQuote.language]?.[randomQuote.id];
    if (userqr) {
      $(".pageTest #result #rateQuoteButton .icon")
        .removeClass("far")
        .addClass("fas");
    }
    QuoteRatePopup.getQuoteStats(randomQuote).then((quoteStats) => {
      $(".pageTest #result #rateQuoteButton .rating").text(
        quoteStats?.average?.toFixed(1) ?? ""
      );
      $(".pageTest #result #rateQuoteButton")
        .css({ opacity: 0 })
        .removeClass("hidden")
        .css({ opacity: 1 });
    });
  }
}

function updateQuoteFavorite(randomQuote: MonkeyTypes.Quote): void {
  quoteLang = Config.mode === "quote" ? randomQuote.language : "";
  quoteId = Config.mode === "quote" ? randomQuote.id.toString() : "";

  const icon = $(".pageTest #result #favoriteQuoteButton .icon");

  if (Config.mode === "quote" && Auth?.currentUser) {
    const userFav = QuotesController.isQuoteFavorite(randomQuote);

    icon.removeClass(userFav ? "far" : "fas").addClass(userFav ? "fas" : "far");
    icon.parent().removeClass("hidden");
  } else {
    icon.parent().addClass("hidden");
  }
}

function updateQuoteSource(randomQuote: MonkeyTypes.Quote): void {
  if (Config.mode === "quote") {
    $("#result .stats .source").removeClass("hidden");
    $("#result .stats .source .bottom").html(randomQuote.source);
  } else {
    $("#result .stats .source").addClass("hidden");
  }
}

export async function update(
  res: MonkeyTypes.Result<MonkeyTypes.Mode>,
  difficultyFailed: boolean,
  failReason: string,
  afkDetected: boolean,
  isRepeated: boolean,
  tooShort: boolean,
  randomQuote: MonkeyTypes.Quote,
  dontSave: boolean
): Promise<void> {
  resultScaleOptions = (
    ChartController.result.options as ScaleChartOptions<"line" | "scatter">
  ).scales;
  resultAnnotation = [];
  result = Object.assign({}, res);
  $("#result #resultWordsHistory").addClass("hidden");
  $("#retrySavingResultButton").addClass("hidden");
  $(".pageTest #result #rateQuoteButton .icon")
    .removeClass("fas")
    .addClass("far");
  $(".pageTest #result #rateQuoteButton .rating").text("");
  $(".pageTest #result #rateQuoteButton").addClass("hidden");
  $("#testModesNotice").css("opacity", 0);
  $("#words").removeClass("blurred");
  $("#wordsInput").blur();
  $("#result .stats .time .bottom .afk").text("");
  if (Auth?.currentUser) {
    $("#result .loginTip").addClass("hidden");
  } else {
    $("#result .loginTip").removeClass("hidden");
  }
  if (Config.ads === "off" || Config.ads === "result") {
    $("#result #watchVideoAdButton").addClass("hidden");
  } else {
    $("#result #watchVideoAdButton").removeClass("hidden");
  }
  updateWpmAndAcc();
  updateConsistency();
  updateTime();
  updateKey();
  updateTestType(randomQuote);
  updateQuoteSource(randomQuote);
  updateQuoteFavorite(randomQuote);
  await updateGraph();
  await updateGraphPBLine();
  updateTags(dontSave);
  updateOther(difficultyFailed, failReason, afkDetected, isRepeated, tooShort);

  ((ChartController.result.options as PluginChartOptions<"line" | "scatter">)
    .plugins.annotation.annotations as AnnotationOptions<"line">[]) =
    resultAnnotation;
  ChartController.result.updateColors();
  ChartController.result.resize();

  if (
    $("#result .stats .tags").hasClass("hidden") &&
    $("#result .stats .info").hasClass("hidden")
  ) {
    $("#result .stats .infoAndTags").addClass("hidden");
  } else {
    $("#result .stats .infoAndTags").removeClass("hidden");
  }

  if (GlarsesMode.get()) {
    $("#middle #result .noStressMessage").remove();
    $("#middle #result").prepend(`

      <div class='noStressMessage' style="
        text-align: center;
        grid-column: 1/3;
        font-size: 2rem;
        padding-bottom: 2rem;
      ">
      <i class="fas fa-check"></i>
      </div>

    `);
    $("#middle #result .stats").addClass("hidden");
    $("#middle #result .chart").addClass("hidden");
    $("#middle #result #resultWordsHistory").addClass("hidden");
    $("#middle #result #resultReplay").addClass("hidden");
    $("#middle #result .loginTip").addClass("hidden");
    $("#middle #result #showWordHistoryButton").addClass("hidden");
    $("#middle #result #watchReplayButton").addClass("hidden");
    $("#middle #result #saveScreenshotButton").addClass("hidden");

    console.log(
      `Test Completed: ${result.wpm} wpm ${result.acc}% acc ${result.rawWpm} raw ${result.consistency}% consistency`
    );
  } else {
    $("#middle #result .stats").removeClass("hidden");
    $("#middle #result .chart").removeClass("hidden");
    // $("#middle #result #resultWordsHistory").removeClass("hidden");
    if (!Auth?.currentUser) {
      $("#middle #result .loginTip").removeClass("hidden");
    }
    $("#middle #result #showWordHistoryButton").removeClass("hidden");
    $("#middle #result #watchReplayButton").removeClass("hidden");
    $("#middle #result #saveScreenshotButton").removeClass("hidden");
  }

  if (window.scrollY > 0) {
    $([document.documentElement, document.body])
      .stop()
      .animate({ scrollTop: 0 }, 250);
  }

  TestConfig.hide();

  Misc.swapElements(
    $("#typingTest"),
    $("#result"),
    250,
    async () => {
      AdController.renderResult();
      TestUI.setResultCalculating(false);
      $("#words").empty();
      ChartController.result.resize();

      if (Config.alwaysShowWordsHistory && Config.burstHeatmap) {
        TestUI.applyBurstHeatmap();
      }
      $("#result").trigger("focus");
      window.scrollTo({ top: 0 });
      $("#testModesNotice").addClass("hidden");
    },
    async () => {
      $("#resultExtraButtons").removeClass("hidden").css("opacity", 0).animate(
        {
          opacity: 1,
        },
        125
      );
      if (Config.alwaysShowWordsHistory && !GlarsesMode.get()) {
        TestUI.toggleResultWords();
      }
      Keymap.hide();
      AdController.updateTestPageAds(true);
    }
  );
}

$(".pageTest #favoriteQuoteButton").on("click", async () => {
  if (quoteLang === "" || quoteId === "") {
    Notifications.add("Could not get quote stats!", -1);
    return;
  }

  const $button = $(".pageTest #favoriteQuoteButton .icon");
  const dbSnapshot = DB.getSnapshot();
  if (!dbSnapshot) return;

  if ($button.hasClass("fas")) {
    // Remove from favorites
    Loader.show();
    const response = await Ape.users.removeQuoteFromFavorites(
      quoteLang,
      quoteId
    );
    Loader.hide();

    Notifications.add(response.message, response.status === 200 ? 1 : -1);

    if (response.status === 200) {
      $button.removeClass("fas").addClass("far");
      const quoteIndex = dbSnapshot.favoriteQuotes[quoteLang]?.indexOf(quoteId);
      dbSnapshot.favoriteQuotes[quoteLang]?.splice(quoteIndex, 1);
    }
  } else {
    // Add to favorites
    Loader.show();
    const response = await Ape.users.addQuoteToFavorites(quoteLang, quoteId);
    Loader.hide();

    Notifications.add(response.message, response.status === 200 ? 1 : -1);

    if (response.status === 200) {
      $button.removeClass("far").addClass("fas");
      if (!dbSnapshot.favoriteQuotes[quoteLang]) {
        dbSnapshot.favoriteQuotes[quoteLang] = [];
      }
      dbSnapshot.favoriteQuotes[quoteLang]?.push(quoteId);
    }
  }
});
