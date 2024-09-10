import * as DB from "../db";
import * as ResultFilters from "../elements/account/result-filters";
import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "../controllers/chart-controller";
import Config, * as UpdateConfig from "../config";
import * as MiniResultChartModal from "../modals/mini-result-chart";
import * as PbTables from "../elements/account/pb-tables";
import * as LoadingPage from "./loading";
import * as Focus from "../test/focus";
import * as TodayTracker from "../test/today-tracker";
import * as Notifications from "../elements/notifications";
import Page from "./page";
import * as DateTime from "../utils/date-and-time";
import * as Misc from "../utils/misc";
import * as Arrays from "../utils/arrays";
import * as Numbers from "../utils/numbers";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as Profile from "../elements/profile";
import { format } from "date-fns/format";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "../utils/skeleton";
import type { ScaleChartOptions, LinearScaleOptions } from "chart.js";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import { Auth } from "../firebase";
import * as Loader from "../elements/loader";
import * as ResultBatches from "../elements/result-batches";
import Format from "../utils/format";
import * as TestActivity from "../elements/test-activity";
import { ChartData } from "@monkeytype/contracts/schemas/results";
import { Mode, Mode2, Mode2Custom } from "@monkeytype/contracts/schemas/shared";
import { ResultFiltersGroupItem } from "@monkeytype/contracts/schemas/users";

let filterDebug = false;
//toggle filterdebug
export function toggleFilterDebug(): void {
  filterDebug = !filterDebug;
  if (filterDebug) {
    console.log("filterDebug is on");
  }
}

let filteredResults: MonkeyTypes.FullResult<Mode>[] = [];
let visibleTableLines = 0;

function loadMoreLines(lineIndex?: number): void {
  if (filteredResults === undefined || filteredResults.length === 0) return;
  let newVisibleLines;
  if (lineIndex && lineIndex > visibleTableLines) {
    newVisibleLines = Math.ceil(lineIndex / 10) * 10;
  } else {
    newVisibleLines = visibleTableLines + 10;
  }
  for (let i = visibleTableLines; i < newVisibleLines; i++) {
    const result = filteredResults[i];
    if (!result) continue;
    let diff = result.difficulty;
    if (diff === undefined) {
      diff = "normal";
    }

    let icons = `<span aria-label="${result.language?.replace(
      "_",
      " "
    )}" data-balloon-pos="up"><i class="fas fa-fw fa-globe-americas"></i></span>`;

    if (diff === "normal") {
      icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="far fa-fw fa-star"></i></span>`;
    } else if (diff === "expert") {
      icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="fas fa-fw fa-star-half-alt"></i></span>`;
    } else if (diff === "master") {
      icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="fas fa-fw fa-star"></i></span>`;
    }

    if (result.punctuation) {
      icons += `<span aria-label="punctuation" data-balloon-pos="up"><i class="fas fa-fw fa-at"></i></span>`;
    }

    if (result.numbers) {
      icons += `<span aria-label="numbers" data-balloon-pos="up"><i class="fas fa-fw fa-hashtag"></i></span>`;
    }

    if (result.blindMode) {
      icons += `<span aria-label="blind mode" data-balloon-pos="up"><i class="fas fa-fw fa-eye-slash"></i></span>`;
    }

    if (result.lazyMode) {
      icons += `<span aria-label="lazy mode" data-balloon-pos="up"><i class="fas fa-fw fa-couch"></i></span>`;
    }

    if (result.funbox !== "none" && result.funbox !== undefined) {
      icons += `<span aria-label="${result.funbox
        .replace(/_/g, " ")
        .replace(
          /#/g,
          ", "
        )}" data-balloon-pos="up"><i class="fas fa-gamepad"></i></span>`;
    }

    if (result.chartData === undefined) {
      icons += `<span class="miniResultChartButton" aria-label="No chart data found" data-balloon-pos="up"><i class="fas fa-chart-line"></i></span>`;
    } else if (result.chartData === "toolong") {
      icons += `<span class="miniResultChartButton" aria-label="Chart history is not available for long tests" data-balloon-pos="up"><i class="fas fa-chart-line"></i></span>`;
    } else {
      icons += `<span class="miniResultChartButton" aria-label="View graph" data-balloon-pos="up" filteredResultsId="${i}" style="opacity: 1"><i class="fas fa-chart-line"></i></span>`;
    }

    let tagNames = "no tags";

    if (result.tags !== undefined && result.tags.length > 0) {
      tagNames = "";
      result.tags.forEach((tag) => {
        DB.getSnapshot()?.tags?.forEach((snaptag) => {
          if (tag === snaptag._id) {
            tagNames += snaptag.display + ", ";
          }
        });
      });
      tagNames = tagNames.substring(0, tagNames.length - 2);
    }

    let restags;
    if (result.tags === undefined) {
      restags = "[]";
    } else {
      restags = JSON.stringify(result.tags);
    }

    const isActive = result.tags !== undefined && result.tags.length > 0;
    const icon =
      result.tags !== undefined && result.tags.length > 1
        ? "fa-tags"
        : "fa-tag";

    const resultTagsButton = `<button class="textButton resultEditTagsButton ${
      isActive ? "active" : ""
    }" data-result-id="${
      result._id
    }" data-tags='${restags}' aria-label="${tagNames}" data-balloon-pos="up"><i class="fas fa-fw ${icon}"></i></button>`;

    let pb = "";
    if (result.isPb) {
      pb = '<i class="fas fa-fw fa-crown"></i>';
    } else {
      pb = "";
    }

    const charStats = result.charStats.join("/");

    const mode2 = result.mode === "custom" ? "" : result.mode2;

    const date = new Date(result.timestamp);
    $(".pageAccount .history table tbody").append(`
    <tr class="resultRow" id="result-${i}">
    <td>${pb}</td>
    <td>${Format.typingSpeed(result.wpm, { showDecimalPlaces: true })}</td>
    <td>${Format.typingSpeed(result.rawWpm, { showDecimalPlaces: true })}</td>
    <td>${Format.percentage(result.acc, { showDecimalPlaces: true })}</td>
    <td>${Format.percentage(result.consistency, {
      showDecimalPlaces: true,
    })}</td>
    <td>${charStats}</td>
    <td>${result.mode} ${mode2}</td>
    <td class="infoIcons">${icons}</td>
    <td>${resultTagsButton}</td>
    <td>${format(date, "dd MMM yyyy")}<br>
    ${format(date, "HH:mm")}
    </td>
    </tr>`);
  }
  visibleTableLines = newVisibleLines;
  if (visibleTableLines >= filteredResults.length) {
    $(".pageAccount .loadMoreButton").addClass("hidden");
  } else {
    $(".pageAccount .loadMoreButton").removeClass("hidden");
  }
}

async function updateChartColors(): Promise<void> {
  await ChartController.accountHistory.updateColors();
  await Misc.sleep(0);
  await ChartController.accountActivity.updateColors();
  await Misc.sleep(0);
  await ChartController.accountHistogram.updateColors();
  await Misc.sleep(0);
}

function reset(): void {
  $(".pageAccount .history table tbody").empty();

  ChartController.accountHistogram.getDataset("count").data = [];
  ChartController.accountActivity.getDataset("count").data = [];
  ChartController.accountActivity.getDataset("avgWpm").data = [];
  ChartController.accountHistory.getDataset("wpm").data = [];
  ChartController.accountHistory.getDataset("pb").data = [];
  ChartController.accountHistory.getDataset("acc").data = [];
  ChartController.accountHistory.getDataset("wpmAvgTen").data = [];
  ChartController.accountHistory.getDataset("accAvgTen").data = [];
  ChartController.accountHistory.getDataset("wpmAvgHundred").data = [];
  ChartController.accountHistory.getDataset("accAvgHundred").data = [];
}

let totalSecondsFiltered = 0;
let chartData: MonkeyTypes.HistoryChartData[] = [];
let accChartData: MonkeyTypes.AccChartData[] = [];

async function fillContent(): Promise<void> {
  LoadingPage.updateText("Displaying stats...");
  LoadingPage.updateBar(100);
  console.log("updating account page");
  ThemeColors.update();

  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  PbTables.update(snapshot.personalBests);
  void Profile.update("account", snapshot);

  TestActivity.init(snapshot.testActivity, new Date(snapshot.addedAt));
  void ResultBatches.update();

  chartData = [];
  accChartData = [];
  const wpmChartData: number[] = [];
  visibleTableLines = 0;

  let topWpm = 0;
  let topMode = "";
  let testRestarts = 0;
  let totalWpm = 0;
  let testCount = 0;

  let last10 = 0;
  let wpmLast10total = 0;

  let topAcc = 0;
  let totalAcc = 0;
  let totalAcc10 = 0;

  const rawWpm = {
    total: 0,
    count: 0,
    last10Total: 0,
    last10Count: 0,
    max: 0,
  };

  let totalEstimatedWords = 0;

  // let totalSeconds = 0;
  totalSecondsFiltered = 0;

  let topCons = 0;
  let totalCons = 0;
  let totalCons10 = 0;
  let consCount = 0;

  type ActivityChartData = Record<
    number,
    {
      amount: number;
      time: number;
      totalWpm: number;
    }
  >;

  const activityChartData: ActivityChartData = {};
  const histogramChartData: number[] = [];
  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);

  filteredResults = [];
  $(".pageAccount .history table tbody").empty();

  DB.getSnapshot()?.results?.forEach((result) => {
    // totalSeconds += tt;

    //apply filters
    try {
      if (!ResultFilters.getFilter("pb", result.isPb ? "yes" : "no")) {
        if (filterDebug) {
          console.log(`skipping result due to pb filter`, result);
        }
        return;
      }

      let resdiff = result.difficulty;
      if (resdiff === undefined) {
        resdiff = "normal";
      }
      if (!ResultFilters.getFilter("difficulty", resdiff)) {
        if (filterDebug) {
          console.log(`skipping result due to difficulty filter`, result);
        }
        return;
      }
      if (!ResultFilters.getFilter("mode", result.mode)) {
        if (filterDebug) {
          console.log(`skipping result due to mode filter`, result);
        }
        return;
      }

      if (result.mode === "time") {
        let timefilter: Mode2<"time"> | "custom" = "custom";
        if (
          ["15", "30", "60", "120"].includes(
            `${result.mode2}` //legacy results could have a number in mode2
          )
        ) {
          timefilter = `${result.mode2}` as `${number}`;
        }
        if (
          !ResultFilters.getFilter(
            "time",
            timefilter as "custom" | "15" | "30" | "60" | "120"
          )
        ) {
          if (filterDebug) {
            console.log(`skipping result due to time filter`, result);
          }
          return;
        }
      } else if (result.mode === "words") {
        let wordfilter: Mode2Custom<"words"> = "custom";
        if (
          ["10", "25", "50", "100", "200"].includes(
            `${result.mode2}` //legacy results could have a number in mode2
          )
        ) {
          wordfilter = `${result.mode2}` as `${number}`;
        }
        if (
          !ResultFilters.getFilter(
            "words",
            wordfilter as "custom" | "10" | "25" | "50" | "100"
          )
        ) {
          if (filterDebug) {
            console.log(`skipping result due to word filter`, result);
          }
          return;
        }
      }

      if (result.quoteLength !== null) {
        let filter: MonkeyTypes.QuoteModes | undefined = undefined;
        if (result.quoteLength === 0) {
          filter = "short";
        } else if (result.quoteLength === 1) {
          filter = "medium";
        } else if (result.quoteLength === 2) {
          filter = "long";
        } else if (result.quoteLength === 3) {
          filter = "thicc";
        }
        if (
          filter !== undefined &&
          !ResultFilters.getFilter("quoteLength", filter)
        ) {
          if (filterDebug) {
            console.log(`skipping result due to quoteLength filter`, result);
          }
          return;
        }
      }

      let langFilter = ResultFilters.getFilter(
        "language",
        result.language ?? "english"
      );

      if (
        result.language === "english_expanded" &&
        ResultFilters.getFilter("language", "english_1k")
      ) {
        langFilter = true;
      }
      if (!langFilter) {
        if (filterDebug) {
          console.log(`skipping result due to language filter`, result);
        }
        return;
      }

      let puncfilter: ResultFiltersGroupItem<"punctuation"> = "off";
      if (result.punctuation) {
        puncfilter = "on";
      }
      if (!ResultFilters.getFilter("punctuation", puncfilter)) {
        if (filterDebug) {
          console.log(`skipping result due to punctuation filter`, result);
        }
        return;
      }

      let numfilter: ResultFiltersGroupItem<"numbers"> = "off";
      if (result.numbers) {
        numfilter = "on";
      }
      if (!ResultFilters.getFilter("numbers", numfilter)) {
        if (filterDebug) {
          console.log(`skipping result due to numbers filter`, result);
        }
        return;
      }

      if (result.funbox === "none" || result.funbox === undefined) {
        if (!ResultFilters.getFilter("funbox", "none")) {
          if (filterDebug) {
            console.log(`skipping result due to funbox filter`, result);
          }
          return;
        }
      } else {
        let counter = 0;
        for (const f of result.funbox.split("#")) {
          if (ResultFilters.getFilter("funbox", f)) {
            counter++;
            break;
          }
        }
        if (counter === 0) {
          if (filterDebug) {
            console.log(`skipping result due to funbox filter`, result);
          }
          return;
        }
      }

      let tagHide = true;
      if (result.tags === undefined || result.tags.length === 0) {
        //no tags, show when no tag is enabled
        if ((DB.getSnapshot()?.tags?.length ?? 0) > 0) {
          if (ResultFilters.getFilter("tags", "none")) tagHide = false;
        } else {
          tagHide = false;
        }
      } else {
        //tags exist
        const validTags = DB.getSnapshot()?.tags?.map((t) => t._id);

        if (validTags === undefined) return;

        result.tags.forEach((tag) => {
          //check if i even need to check tags anymore
          if (!tagHide) return;
          //check if tag is valid
          if (validTags?.includes(tag)) {
            //tag valid, check if filter is on
            if (ResultFilters.getFilter("tags", tag)) tagHide = false;
          } else {
            //tag not found in valid tags, meaning probably deleted
            if (ResultFilters.getFilter("tags", "none")) tagHide = false;
          }
        });
      }

      if (tagHide) {
        if (filterDebug) {
          console.log(`skipping result due to tag filter`, result);
        }
        return;
      }

      const timeSinceTest = Math.abs(result.timestamp - Date.now()) / 1000;

      let datehide = true;

      if (
        ResultFilters.getFilter("date", "all") ||
        (ResultFilters.getFilter("date", "last_day") &&
          timeSinceTest <= 86400) ||
        (ResultFilters.getFilter("date", "last_week") &&
          timeSinceTest <= 604800) ||
        (ResultFilters.getFilter("date", "last_month") &&
          timeSinceTest <= 2592000) ||
        (ResultFilters.getFilter("date", "last_3months") &&
          timeSinceTest <= 7776000)
      ) {
        datehide = false;
      }

      if (datehide) {
        if (filterDebug) {
          console.log(`skipping result due to date filter`, result);
        }
        return;
      }

      filteredResults.push(result);
    } catch (e) {
      Notifications.add(
        "Something went wrong when filtering. Resetting filters.",
        0
      );
      console.log(result);
      console.error(e);
      ResultFilters.reset();
      ResultFilters.updateActive();
      void update();
      return;
    }
    //filters done
    //=======================================

    totalEstimatedWords += Math.round((result.wpm / 60) * result.testDuration);

    const resultDate = new Date(result.timestamp);
    resultDate.setSeconds(0);
    resultDate.setMinutes(0);
    resultDate.setHours(0);
    resultDate.setMilliseconds(0);
    const resultTimestamp = resultDate.getTime();

    const dataForTimestamp = activityChartData[resultTimestamp];

    if (dataForTimestamp !== undefined) {
      dataForTimestamp.amount++;
      dataForTimestamp.time +=
        result.testDuration +
        result.incompleteTestSeconds -
        (result.afkDuration ?? 0);
      dataForTimestamp.totalWpm += result.wpm;
    } else {
      activityChartData[resultTimestamp] = {
        amount: 1,
        time:
          result.testDuration +
          result.incompleteTestSeconds -
          (result.afkDuration ?? 0),
        totalWpm: result.wpm,
      };
    }

    const bucketSize = typingSpeedUnit.histogramDataBucketSize;
    const bucket = Math.floor(
      Math.round(typingSpeedUnit.fromWpm(result.wpm)) / bucketSize
    );

    //grow array if needed
    if (histogramChartData.length <= bucket) {
      for (let i = histogramChartData.length; i <= bucket; i++) {
        histogramChartData.push(0);
      }
    }
    (histogramChartData[bucket] as number)++;

    let tt = 0;
    if (
      result.testDuration === undefined &&
      result.mode2 !== "custom" &&
      result.mode2 !== "zen"
    ) {
      //test finished before testDuration field was introduced - estimate
      if (result.mode === "time") {
        tt = parseInt(result.mode2);
      } else if (result.mode === "words") {
        tt = (parseInt(result.mode2) / result.wpm) * 60;
      }
    } else {
      tt = parseFloat(result.testDuration as unknown as string); //legacy results could have a string here
    }
    if (result.incompleteTestSeconds !== undefined) {
      tt += result.incompleteTestSeconds;
    } else if (result.restartCount !== undefined && result.restartCount > 0) {
      tt += (tt / 4) * result.restartCount;
    }

    // if (result.incompleteTestSeconds !== undefined) {
    //   tt += result.incompleteTestSeconds;
    // } else if (result.restartCount !== undefined && result.restartCount > 0) {
    //   tt += (tt / 4) * result.restartCount;
    // }
    totalSecondsFiltered += tt;

    if (last10 < 10) {
      last10++;
      wpmLast10total += result.wpm;
      totalAcc10 += result.acc;
      if (result.consistency !== undefined) {
        totalCons10 += result.consistency;
      }
    }
    testCount++;

    if (result.consistency !== undefined) {
      consCount++;
      totalCons += result.consistency;
      if (result.consistency > topCons) {
        topCons = result.consistency;
      }
    }

    if (result.rawWpm !== null) {
      if (rawWpm.last10Count < 10) {
        rawWpm.last10Count++;
        rawWpm.last10Total += result.rawWpm;
      }
      rawWpm.total += result.rawWpm;
      rawWpm.count++;
      if (result.rawWpm > rawWpm.max) {
        rawWpm.max = result.rawWpm;
      }
    }

    if (result.acc > topAcc) {
      topAcc = result.acc;
    }

    totalAcc += result.acc;

    if (result.restartCount !== undefined) {
      testRestarts += result.restartCount;
    }

    chartData.push({
      x: filteredResults.length,
      y: Numbers.roundTo2(typingSpeedUnit.fromWpm(result.wpm)),
      wpm: Numbers.roundTo2(typingSpeedUnit.fromWpm(result.wpm)),
      acc: result.acc,
      mode: result.mode,
      mode2: result.mode2,
      punctuation: result.punctuation,
      language: result.language,
      timestamp: result.timestamp,
      difficulty: result.difficulty,
      raw: Numbers.roundTo2(typingSpeedUnit.fromWpm(result.rawWpm)),
      isPb: result.isPb ?? false,
    });

    wpmChartData.push(result.wpm);

    accChartData.push({
      x: filteredResults.length,
      y: result.acc,
      errorRate: 100 - result.acc,
    });

    if (result.wpm > topWpm) {
      const puncsctring = result.punctuation ? ",<br>with punctuation" : "";
      const numbsctring = result.numbers
        ? ",<br> " + (result.punctuation ? "&" : "") + "with numbers"
        : "";
      topWpm = result.wpm;
      if (result.mode === "custom") topMode = result.mode;
      else {
        topMode = result.mode + " " + result.mode2 + puncsctring + numbsctring;
      }
    }

    totalWpm += result.wpm;
  });

  $(".pageAccount .group.history table thead tr td:nth-child(2)").text(
    Config.typingSpeedUnit
  );

  await Misc.sleep(0);
  loadMoreLines();
  ////////

  const activityChartData_timeAndAmount: MonkeyTypes.ActivityChartDataPoint[] =
    [];
  const activityChartData_avgWpm: MonkeyTypes.ActivityChartDataPoint[] = [];
  const wpmStepSize = typingSpeedUnit.historyStepSize;

  // let lastTimestamp = 0;
  for (const date of Object.keys(activityChartData)) {
    const dateInt = parseInt(date);
    const dataPoint = activityChartData[dateInt];

    if (dataPoint === undefined) continue;

    activityChartData_timeAndAmount.push({
      x: dateInt,
      y: dataPoint.time / 60,
      amount: dataPoint.amount,
    });
    activityChartData_avgWpm.push({
      x: dateInt,
      y: Numbers.roundTo2(
        typingSpeedUnit.fromWpm(dataPoint.totalWpm) / dataPoint.amount
      ),
    });
    // lastTimestamp = date;
  }

  const accountActivityScaleOptions = (
    ChartController.accountActivity.options as ScaleChartOptions<"bar" | "line">
  ).scales;

  const accountActivityAvgWpmOptions = accountActivityScaleOptions[
    "avgWpm"
  ] as LinearScaleOptions;

  accountActivityAvgWpmOptions.title.text = "Average " + Config.typingSpeedUnit;
  accountActivityAvgWpmOptions.ticks.stepSize = wpmStepSize;

  ChartController.accountActivity.getDataset("count").data =
    activityChartData_timeAndAmount;
  ChartController.accountActivity.getDataset("avgWpm").data =
    activityChartData_avgWpm;

  const histogramChartDataBucketed: { x: number; y: number }[] = [];
  const labels: string[] = [];

  const bucketSize = typingSpeedUnit.histogramDataBucketSize;
  const bucketSizeUpperBound = bucketSize - (bucketSize <= 1 ? 0.01 : 1);

  histogramChartData.forEach((amount: number, i: number) => {
    const bucket = i * bucketSize;
    labels.push(`${bucket} - ${bucket + bucketSizeUpperBound}`);
    histogramChartDataBucketed.push({
      x: bucket,
      y: amount,
    });
  });

  ChartController.accountHistogram.data.labels = labels;
  ChartController.accountHistogram.getDataset("count").data =
    histogramChartDataBucketed;

  const accountHistoryScaleOptions = (
    ChartController.accountHistory.options as ScaleChartOptions<"line">
  ).scales;

  const accountHistoryWpmOptions = accountHistoryScaleOptions[
    "wpm"
  ] as LinearScaleOptions;
  accountHistoryWpmOptions.title.text = typingSpeedUnit.fullUnitString;

  if (chartData.length > 0) {
    // get pb points
    let currentPb = 0;
    const pb: { x: number; y: number }[] = [];

    for (let i = chartData.length - 1; i >= 0; i--) {
      const a = chartData[i] as MonkeyTypes.HistoryChartData;
      if (a.y > currentPb) {
        currentPb = a.y;
        pb.push(a);
      }
    }

    // add last point to pb
    pb.push({
      x: 1,
      y: Arrays.lastElementFromArray(pb)?.y as number,
    });

    const avgTen = [];
    const avgTenAcc = [];
    const avgHundred = [];
    const avgHundredAcc = [];

    for (let i = 0; i < chartData.length; i++) {
      // calculate averages of 10
      const subsetTen = chartData.slice(i, i + 10);
      const accSubsetTen = accChartData.slice(i, i + 10);
      const avgTenValue =
        subsetTen.reduce((acc, { y }) => acc + y, 0) / subsetTen.length;
      const accAvgTenValue =
        accSubsetTen.reduce((acc, { y }) => acc + y, 0) / accSubsetTen.length;

      avgTen.push({ x: i + 1, y: avgTenValue });
      avgTenAcc.push({ x: i + 1, y: accAvgTenValue });

      // calculate averages of 100
      const subsetHundred = chartData.slice(i, i + 100);
      const accSubsetHundred = accChartData.slice(i, i + 100);
      const avgHundredValue =
        subsetHundred.reduce((acc, { y }) => acc + y, 0) / subsetHundred.length;
      const accAvgHundredValue =
        accSubsetHundred.reduce((acc, { y }) => acc + y, 0) /
        accSubsetHundred.length;
      avgHundred.push({ x: i + 1, y: avgHundredValue });
      avgHundredAcc.push({ x: i + 1, y: accAvgHundredValue });
    }

    ChartController.accountHistory.getDataset("wpm").data = chartData;
    ChartController.accountHistory.getDataset("pb").data = pb;
    ChartController.accountHistory.getDataset("acc").data = accChartData;
    ChartController.accountHistory.getDataset("wpmAvgTen").data = avgTen;
    ChartController.accountHistory.getDataset("accAvgTen").data = avgTenAcc;
    ChartController.accountHistory.getDataset("wpmAvgHundred").data =
      avgHundred;
    ChartController.accountHistory.getDataset("accAvgHundred").data =
      avgHundredAcc;

    ChartController.accountHistory.getScale("x").max = chartData.length + 1;
  }

  const wpms = chartData.map((r) => r.y);
  const minWpm = Math.min(...wpms);
  const maxWpm = Math.max(...wpms);
  const minWpmChartVal = isFinite(minWpm) ? minWpm : 0;
  const maxWpmChartVal = isFinite(maxWpm) ? maxWpm : 0;
  const maxWpmChartValWithBuffer =
    Math.floor(maxWpmChartVal) +
    (wpmStepSize - (Math.floor(maxWpmChartVal) % wpmStepSize));

  // let accuracies = accChartData.map((r) => r.y);
  accountHistoryWpmOptions.max = maxWpmChartValWithBuffer;

  accountHistoryWpmOptions.ticks.stepSize = wpmStepSize;

  ChartController.accountHistory.getScale("pb").max = maxWpmChartValWithBuffer;
  ChartController.accountHistory.getScale("wpmAvgTen").max =
    maxWpmChartValWithBuffer;
  ChartController.accountHistory.getScale("wpmAvgHundred").max =
    maxWpmChartValWithBuffer;

  if (!Config.startGraphsAtZero) {
    const minWpmChartValFloor =
      Math.floor(minWpmChartVal / wpmStepSize) * wpmStepSize;

    ChartController.accountHistory.getScale("wpm").min = minWpmChartValFloor;
    ChartController.accountHistory.getScale("pb").min = minWpmChartValFloor;
    ChartController.accountHistory.getScale("wpmAvgTen").min =
      minWpmChartValFloor;
    ChartController.accountHistory.getScale("wpmAvgHundred").min =
      minWpmChartValFloor;
  } else {
    ChartController.accountHistory.getScale("wpm").min = 0;
    ChartController.accountHistory.getScale("pb").min = 0;
    ChartController.accountHistory.getScale("wpmAvgTen").min = 0;
    ChartController.accountHistory.getScale("wpmAvgHundred").min = 0;
  }

  if (chartData === undefined || chartData.length === 0) {
    $(".pageAccount .group.noDataError").removeClass("hidden");
    $(".pageAccount .group.chart").addClass("hidden");
    $(".pageAccount .group.dailyActivityChart").addClass("hidden");
    $(".pageAccount .group.histogramChart").addClass("hidden");
    $(".pageAccount .group.aboveHistory").addClass("hidden");
    $(".pageAccount .group.history").addClass("hidden");
    $(".pageAccount .triplegroup.stats").addClass("hidden");
    $(".pageAccount .group.estimatedWordsTyped").addClass("hidden");
  } else {
    $(".pageAccount .group.noDataError").addClass("hidden");
    $(".pageAccount .group.chart").removeClass("hidden");
    $(".pageAccount .group.dailyActivityChart").removeClass("hidden");
    $(".pageAccount .group.histogramChart").removeClass("hidden");
    $(".pageAccount .group.aboveHistory").removeClass("hidden");
    $(".pageAccount .group.history").removeClass("hidden");
    $(".pageAccount .triplegroup.stats").removeClass("hidden");
    $(".pageAccount .group.estimatedWordsTyped").removeClass("hidden");
  }

  $(".pageAccount .timeTotalFiltered .val").text(
    DateTime.secondsToString(Math.round(totalSecondsFiltered), true, true)
  );

  const speedUnit = Config.typingSpeedUnit;

  $(".pageAccount .highestWpm .title").text(`highest ${speedUnit}`);
  $(".pageAccount .highestWpm .val").text(Format.typingSpeed(topWpm));

  $(".pageAccount .averageWpm .title").text(`average ${speedUnit}`);
  $(".pageAccount .averageWpm .val").text(
    Format.typingSpeed(totalWpm / testCount)
  );

  $(".pageAccount .averageWpm10 .title").text(
    `average ${speedUnit} (last 10 tests)`
  );
  $(".pageAccount .averageWpm10 .val").text(
    Format.typingSpeed(wpmLast10total / last10)
  );

  $(".pageAccount .highestRaw .title").text(`highest raw ${speedUnit}`);
  $(".pageAccount .highestRaw .val").text(Format.typingSpeed(rawWpm.max));

  $(".pageAccount .averageRaw .title").text(`average raw ${speedUnit}`);
  $(".pageAccount .averageRaw .val").text(
    Format.typingSpeed(rawWpm.total / rawWpm.count)
  );

  $(".pageAccount .averageRaw10 .title").text(
    `average raw ${speedUnit} (last 10 tests)`
  );
  $(".pageAccount .averageRaw10 .val").text(
    Format.typingSpeed(rawWpm.last10Total / rawWpm.last10Count)
  );

  $(".pageAccount .highestWpm .mode").html(topMode);
  $(".pageAccount .testsTaken .val").text(testCount);

  $(".pageAccount .highestAcc .val").text(Format.accuracy(topAcc));
  $(".pageAccount .avgAcc .val").text(Format.accuracy(totalAcc / testCount));
  $(".pageAccount .avgAcc10 .val").text(Format.accuracy(totalAcc10 / last10));

  if (totalCons === 0 || totalCons === undefined) {
    $(".pageAccount .avgCons .val").text("-");
    $(".pageAccount .avgCons10 .val").text("-");
  } else {
    $(".pageAccount .highestCons .val").text(Format.percentage(topCons));

    $(".pageAccount .avgCons .val").text(
      Format.percentage(totalCons / consCount)
    );

    $(".pageAccount .avgCons10 .val").text(
      Format.percentage(totalCons10 / Math.min(last10, consCount))
    );
  }

  $(".pageAccount .testsStarted .val").text(`${testCount + testRestarts}`);
  $(".pageAccount .testsCompleted .val").text(
    `${testCount}(${Math.floor(
      (testCount / (testCount + testRestarts)) * 100
    )}%)`
  );

  $(".pageAccount .testsCompleted .avgres").text(`
    ${(testRestarts / testCount).toFixed(1)} restarts per completed test
  `);

  const wpmPoints = filteredResults.map((r) => r.wpm).reverse();

  const trend = Numbers.findLineByLeastSquares(wpmPoints);
  if (trend) {
    const wpmChange = trend[1][1] - trend[0][1];
    const wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);
    const plus = wpmChangePerHour > 0 ? "+" : "";
    $(".pageAccount .group.chart .below .text").text(
      `Speed change per hour spent typing: ${
        plus + Format.typingSpeed(wpmChangePerHour, { showDecimalPlaces: true })
      } ${Config.typingSpeedUnit}`
    );
  }
  $(".pageAccount .estimatedWordsTyped .val").text(totalEstimatedWords);

  if (chartData.length || accChartData.length) {
    ChartController.updateAccountChartButtons();
    ChartController.accountHistory.options.animation = false;
    ChartController.accountHistory.update();
    delete ChartController.accountHistory.options.animation;
  }
  await Misc.sleep(0);
  ChartController.accountActivity.update();
  ChartController.accountHistogram.update();
  LoadingPage.updateBar(100, true);
  Focus.set(false);
  void Misc.swapElements(
    $(".pageAccount .preloader"),
    $(".pageAccount .content"),
    250,
    async () => {
      $(".page.pageAccount").css("height", "unset"); //weird safari fix
    },
    async () => {
      setTimeout(() => {
        Profile.updateNameFontSize("account");
      }, 10);
    }
  );
}

export async function downloadResults(offset?: number): Promise<void> {
  const results = await DB.getUserResults(offset);
  if (!results && !ConnectionState.get()) {
    Notifications.add("Could not get results - you are offline", -1, {
      duration: 5,
    });
    return;
  }

  TodayTracker.addAllFromToday();
  if (results) {
    ResultFilters.updateActive();
  }
}

async function update(): Promise<void> {
  LoadingPage.updateBar(0, true);
  if (DB.getSnapshot() === null) {
    Notifications.add(`Missing account data. Please refresh.`, -1);
    $(".pageAccount .preloader").html("Missing account data. Please refresh.");
  } else {
    LoadingPage.updateBar(90);
    await downloadResults();
    try {
      await Misc.sleep(0);
      await fillContent();
    } catch (e) {
      console.error(e);
      Notifications.add(`Something went wrong: ${e}`, -1);
    }
  }
}

export function updateTagsForResult(resultId: string, tagIds: string[]): void {
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

  const el = $(
    `.pageAccount .resultEditTagsButton[data-result-id='${resultId}']`
  );

  el.attr("data-tags", JSON.stringify(tagIds));

  if (tagIds.length > 0) {
    el.attr("aria-label", tagNames.join(", "));
    el.addClass("active");
    if (tagIds.length > 1) {
      el.html(`<i class="fas fa-fw fa-tags"></i>`);
    } else {
      el.html(`<i class="fas fa-fw fa-tag"></i>`);
    }
  } else {
    el.attr("aria-label", "no tags");
    el.removeClass("active");
    el.html(`<i class="fas fa-fw fa-tag"></i>`);
  }
}

function sortAndRefreshHistory(
  keyString: string,
  headerClass: string,
  forceDescending: null | boolean = null
): void {
  // Removes styling from previous sorting requests:
  $("td").removeClass("headerSorted");
  $("td").children("i").remove();
  $(headerClass).addClass("headerSorted");

  if (filteredResults.length < 2) return;

  const key = keyString as keyof (typeof filteredResults)[0];

  // This allows to reverse the sorting order when clicking multiple times on the table header
  let descending = true;
  if (forceDescending !== null) {
    if (forceDescending) {
      $(headerClass).append(
        '<i class="fas fa-sort-down" aria-hidden="true"></i>'
      );
    } else {
      descending = false;
      $(headerClass).append(
        '<i class="fas fa-sort-up" aria-hidden="true"></i>'
      );
    }
  } else if (
    parseInt(filteredResults?.[0]?.[key] as string) <=
    parseInt(filteredResults?.[filteredResults.length - 1]?.[key] as string)
  ) {
    descending = true;
    $(headerClass).append(
      '<i class="fas fa-sort-down" aria-hidden="true"></i>'
    );
  } else {
    descending = false;
    $(headerClass).append('<i class="fas fa-sort-up", aria-hidden="true"></i>');
  }

  const temp: MonkeyTypes.FullResult<Mode>[] = [];
  const parsedIndexes: number[] = [];

  while (temp.length < filteredResults.length) {
    let lowest = Number.MAX_VALUE;
    let highest = -1;
    let idx = -1;

    // for (let i = 0; i < filteredResults.length; i++) {
    for (const [i, result] of filteredResults.entries()) {
      //find the lowest wpm with index not already parsed
      if (!descending) {
        if ((result[key] as number) <= lowest && !parsedIndexes.includes(i)) {
          lowest = result[key] as number;
          idx = i;
        }
      } else {
        if ((result[key] as number) >= highest && !parsedIndexes.includes(i)) {
          highest = result[key] as number;
          idx = i;
        }
      }
    }

    //@ts-expect-error
    temp.push(filteredResults[idx]);
    parsedIndexes.push(idx);
  }
  filteredResults = temp;

  $(".pageAccount .history table tbody").empty();
  visibleTableLines = 0;
  loadMoreLines();
}

$(".pageAccount button.toggleResultsOnChart").on("click", () => {
  const newValue = Config.accountChart;
  newValue[0] = newValue[0] === "on" ? "off" : "on";
  UpdateConfig.setAccountChart(newValue);
});

$(".pageAccount button.toggleAccuracyOnChart").on("click", () => {
  const newValue = Config.accountChart;
  newValue[1] = newValue[1] === "on" ? "off" : "on";
  UpdateConfig.setAccountChart(newValue);
});

$(".pageAccount button.toggleAverage10OnChart").on("click", () => {
  const newValue = Config.accountChart;
  newValue[2] = newValue[2] === "on" ? "off" : "on";
  UpdateConfig.setAccountChart(newValue);
});

$(".pageAccount button.toggleAverage100OnChart").on("click", () => {
  const newValue = Config.accountChart;
  newValue[3] = newValue[3] === "on" ? "off" : "on";
  UpdateConfig.setAccountChart(newValue);
});

$(".pageAccount .loadMoreButton").on("click", () => {
  loadMoreLines();
});

$(".pageAccount #accountHistoryChart").on("click", () => {
  const index: number = ChartController.accountHistoryActiveIndex;
  loadMoreLines(index);
  if (window === undefined) return;
  const windowHeight = $(window).height() ?? 0;
  const offset = $(`#result-${index}`).offset()?.top ?? 0;
  const scrollTo = offset - windowHeight / 2;
  $([document.documentElement, document.body]).animate(
    {
      scrollTop: scrollTo,
    },
    500
  );
  $(".resultRow").removeClass("active");
  $(`#result-${index}`).addClass("active");
});

$(".pageAccount").on("click", ".miniResultChartButton", (event) => {
  console.log("updating");
  const filteredId = $(event.currentTarget).attr("filteredResultsId");
  if (filteredId === undefined) return;
  MiniResultChartModal.show(
    filteredResults[parseInt(filteredId)]?.chartData as ChartData
  );
});

$(".pageAccount .group.history").on("click", ".history-wpm-header", () => {
  sortAndRefreshHistory("wpm", ".history-wpm-header");
});

$(".pageAccount .group.history").on("click", ".history-raw-header", () => {
  sortAndRefreshHistory("rawWpm", ".history-raw-header");
});

$(".pageAccount .group.history").on("click", ".history-acc-header", () => {
  sortAndRefreshHistory("acc", ".history-acc-header");
});

$(".pageAccount .group.history").on(
  "click",
  ".history-correct-chars-header",
  () => {
    sortAndRefreshHistory("correctChars", ".history-correct-chars-header");
  }
);

$(".pageAccount .group.history").on(
  "click",
  ".history-incorrect-chars-header",
  () => {
    sortAndRefreshHistory("incorrectChars", ".history-incorrect-chars-header");
  }
);

$(".pageAccount .group.history").on(
  "click",
  ".history-consistency-header",
  () => {
    sortAndRefreshHistory("consistency", ".history-consistency-header");
  }
);

$(".pageAccount .group.history").on("click", ".history-date-header", () => {
  sortAndRefreshHistory("timestamp", ".history-date-header");
});

// Resets sorting to by date' when applying filers (normal or advanced)
$(".pageAccount .group.history").on(
  "click",
  ".buttonsAndTitle .buttons button",
  () => {
    // We want to 'force' descending sort:
    sortAndRefreshHistory("timestamp", ".history-date-header", true);
  }
);

$(".pageAccount .group.topFilters, .pageAccount .filterButtons").on(
  "click",
  "button",
  () => {
    setTimeout(() => {
      void update();
    }, 0);
  }
);

$(".pageAccount .group.presetFilterButtons").on(
  "click",
  ".filterBtns .filterPresets .select-filter-preset",
  async (e) => {
    await ResultFilters.setFilterPreset($(e.target).data("id") as string);
    void update();
  }
);

$(".pageAccount .content .group.aboveHistory .exportCSV").on("click", () => {
  void Misc.downloadResultsCSV(filteredResults);
});

$(".pageAccount .profile").on("click", ".details .copyLink", () => {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  const { name } = snapshot;
  const url = `${location.origin}/profile/${name}`;

  navigator.clipboard.writeText(url).then(
    function () {
      Notifications.add("URL Copied to clipboard", 0);
    },
    function () {
      alert("Failed to copy using the Clipboard API. Here's the link: " + url);
    }
  );
});

$(".pageAccount button.loadMoreResults").on("click", async () => {
  const offset = DB.getSnapshot()?.results?.length ?? 0;

  Loader.show();
  ResultBatches.disableButton();

  await downloadResults(offset);
  await fillContent();
  Loader.hide();
});

ConfigEvent.subscribe((eventKey) => {
  if (ActivePage.get() === "account" && eventKey === "typingSpeedUnit") {
    void update();
  }
});

export const page = new Page({
  name: "account",
  element: $(".page.pageAccount"),
  path: "/account",
  afterHide: async (): Promise<void> => {
    reset();
    ResultFilters.removeButtons();
    Skeleton.remove("pageAccount");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageAccount", "main");
    const snapshot = DB.getSnapshot();
    if (snapshot?.results === undefined) {
      $(".pageLoading .fill, .pageAccount .fill").css("width", "0%");
      $(".pageAccount .content").addClass("hidden");
      $(".pageAccount .preloader").removeClass("hidden");
      await LoadingPage.showBar();
    }
    await ResultFilters.appendButtons(update);
    ResultFilters.updateActive();
    await Misc.sleep(0);

    TestActivity.initYearSelector(
      "current",
      snapshot !== undefined ? new Date(snapshot.addedAt).getFullYear() : 2020
    );

    void update().then(() => {
      void updateChartColors();
      $(".pageAccount .content .accountVerificatinNotice").remove();
      if (Auth?.currentUser?.emailVerified === false) {
        $(".pageAccount .content").prepend(
          `<div class="accountVerificatinNotice"><i class="fas icon fa-exclamation-triangle"></i><p>Your email address is still not verified</p><button class="sendVerificationEmail">resend verification email</button></div>`
        );
      }
      ResultBatches.showOrHideIfNeeded();
    });
  },
});

$(() => {
  Skeleton.save("pageAccount");
});
