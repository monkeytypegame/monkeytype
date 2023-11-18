import * as DB from "../db";
import * as ResultFilters from "../account/result-filters";
import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "../controllers/chart-controller";
import Config, * as UpdateConfig from "../config";
import * as MiniResultChart from "../account/mini-result-chart";
import * as AllTimeStats from "../account/all-time-stats";
import * as PbTables from "../account/pb-tables";
import * as LoadingPage from "./loading";
import * as Focus from "../test/focus";
import * as TodayTracker from "../test/today-tracker";
import * as Notifications from "../elements/notifications";
import Page from "./page";
import * as Misc from "../utils/misc";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as Profile from "../elements/profile";
import format from "date-fns/format";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "../popups/skeleton";
import type { ScaleChartOptions, LinearScaleOptions } from "chart.js";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import { Auth } from "../firebase";
import * as Loader from "../elements/loader";
import * as ResultBatches from "../elements/result-batches";

let filterDebug = false;
//toggle filterdebug
export function toggleFilterDebug(): void {
  filterDebug = !filterDebug;
  if (filterDebug) {
    console.log("filterDebug is on");
  }
}

let filteredResults: MonkeyTypes.Result<MonkeyTypes.Mode>[] = [];
let visibleTableLines = 0;

function loadMoreLines(lineIndex?: number): void {
  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  if (!filteredResults || filteredResults.length === 0) return;
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

    let raw;
    try {
      raw = typingSpeedUnit.fromWpm(result.rawWpm).toFixed(2);
      if (raw === undefined) {
        raw = "-";
      }
    } catch (e) {
      raw = "-";
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

    let tagNames = "";

    if (result.tags !== undefined && result.tags.length > 0) {
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

    let tagIcons = `<span id="resultEditTags" resultId="${result._id}" tags='${restags}' aria-label="no tags" data-balloon-pos="up" style="opacity: .25"><i class="fas fa-fw fa-tag"></i></span>`;

    if (tagNames !== "") {
      if (result.tags !== undefined && result.tags.length > 1) {
        tagIcons = `<span id="resultEditTags" resultId="${result._id}" tags='${restags}' aria-label="${tagNames}" data-balloon-pos="up"><i class="fas fa-fw fa-tags"></i></span>`;
      } else {
        tagIcons = `<span id="resultEditTags" resultId="${result._id}" tags='${restags}' aria-label="${tagNames}" data-balloon-pos="up"><i class="fas fa-fw fa-tag"></i></span>`;
      }
    }

    let consistency = "-";

    if (result.consistency) {
      consistency = result.consistency.toFixed(2) + "%";
    }

    let pb = result.isPb?.toString();
    if (pb) {
      pb = '<i class="fas fa-fw fa-crown"></i>';
    } else {
      pb = "";
    }

    let charStats = "-";
    if (result.charStats) {
      charStats = result.charStats.join("/");
    } else {
      charStats = result.correctChars + "/" + result.incorrectChars + "/-/-";
    }

    const date = new Date(result.timestamp);
    $(".pageAccount .history table tbody").append(`
    <tr class="resultRow" id="result-${i}">
    <td>${pb}</td>
    <td>${typingSpeedUnit.fromWpm(result.wpm).toFixed(2)}</td>
    <td>${raw}</td>
    <td>${result.acc.toFixed(2)}%</td>
    <td>${consistency}</td>
    <td>${charStats}</td>
    <td>${result.mode} ${result.mode2}</td>
    <td class="infoIcons">${icons}</td>
    <td>${tagIcons}</td>
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
  ChartController.accountHistory.updateColors();
  await Misc.sleep(0);
  ChartController.accountActivity.updateColors();
  await Misc.sleep(0);
  ChartController.accountHistogram.updateColors();
  await Misc.sleep(0);
}

function reset(): void {
  $(".pageAccount .history table tbody").empty();
  ChartController.accountHistogram.data.datasets[0].data = [];
  ChartController.accountActivity.data.datasets[0].data = [];
  ChartController.accountActivity.data.datasets[1].data = [];
  ChartController.accountHistory.data.datasets[0].data = [];
  ChartController.accountHistory.data.datasets[1].data = [];
  ChartController.accountHistory.data.datasets[2].data = [];
  ChartController.accountHistory.data.datasets[3].data = [];
  ChartController.accountHistory.data.datasets[4].data = [];
  ChartController.accountHistory.data.datasets[5].data = [];
  ChartController.accountHistory.data.datasets[6].data = [];
}

let totalSecondsFiltered = 0;
let chartData: MonkeyTypes.HistoryChartData[] = [];
let accChartData: MonkeyTypes.AccChartData[] = [];

async function fillContent(): Promise<void> {
  LoadingPage.updateText("Displaying stats...");
  LoadingPage.updateBar(100);
  console.log("updating account page");
  ThemeColors.update();
  AllTimeStats.update();

  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  PbTables.update(snapshot.personalBests);
  Profile.update("account", snapshot);

  ResultBatches.update();

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

  interface ActivityChartData {
    [key: number]: {
      amount: number;
      time: number;
      totalWpm: number;
    };
  }

  const activityChartData: ActivityChartData = {};
  const histogramChartData: number[] = [];
  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);

  filteredResults = [];
  $(".pageAccount .history table tbody").empty();

  DB.getSnapshot()?.results?.forEach(
    (result: MonkeyTypes.Result<MonkeyTypes.Mode>) => {
      // totalSeconds += tt;

      //apply filters
      try {
        if (
          !ResultFilters.getFilter("pb", result.isPb === true ? "yes" : "no")
        ) {
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
          let timefilter: MonkeyTypes.Mode2<"time"> | "custom" = "custom";
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
          let wordfilter: MonkeyTypes.Mode2Custom<"words"> = "custom";
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

        let puncfilter: MonkeyTypes.Filter<"punctuation"> = "off";
        if (result.punctuation) {
          puncfilter = "on";
        }
        if (!ResultFilters.getFilter("punctuation", puncfilter)) {
          if (filterDebug) {
            console.log(`skipping result due to punctuation filter`, result);
          }
          return;
        }

        let numfilter: MonkeyTypes.Filter<"numbers"> = "off";
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
        update();
      }
      //filters done
      //=======================================

      totalEstimatedWords += Math.round(
        (result.wpm / 60) * result.testDuration
      );

      const resultDate = new Date(result.timestamp);
      resultDate.setSeconds(0);
      resultDate.setMinutes(0);
      resultDate.setHours(0);
      resultDate.setMilliseconds(0);
      const resultTimestamp = resultDate.getTime();

      if (Object.keys(activityChartData).includes(String(resultTimestamp))) {
        activityChartData[resultTimestamp].amount++;
        activityChartData[resultTimestamp].time +=
          result.testDuration +
          result.incompleteTestSeconds -
          (result.afkDuration ?? 0);
        activityChartData[resultTimestamp].totalWpm += result.wpm;
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
        typingSpeedUnit.fromWpm(result.wpm) / bucketSize
      );

      //grow array if needed
      if (histogramChartData.length <= bucket) {
        for (let i = histogramChartData.length; i <= bucket; i++) {
          histogramChartData.push(0);
        }
      }
      histogramChartData[bucket]++;

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
        result.consistency !== undefined
          ? (totalCons10 += result.consistency)
          : 0;
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
        y: Misc.roundTo2(typingSpeedUnit.fromWpm(result.wpm)),
        wpm: Misc.roundTo2(typingSpeedUnit.fromWpm(result.wpm)),
        acc: result.acc,
        mode: result.mode,
        mode2: result.mode2,
        punctuation: result.punctuation as boolean,
        language: result.language,
        timestamp: result.timestamp,
        difficulty: result.difficulty,
        raw: Misc.roundTo2(typingSpeedUnit.fromWpm(result.rawWpm)),
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
          topMode =
            result.mode + " " + result.mode2 + puncsctring + numbsctring;
        }
      }

      totalWpm += result.wpm;
    }
  );

  $(".pageAccount .group.history table thead tr td:nth-child(2)").text(
    Config.typingSpeedUnit
  );

  await Misc.sleep(0);
  loadMoreLines();
  ////////

  const activityChartData_amount: MonkeyTypes.ActivityChartDataPoint[] = [];
  const activityChartData_time: MonkeyTypes.ActivityChartDataPoint[] = [];
  const activityChartData_avgWpm: MonkeyTypes.ActivityChartDataPoint[] = [];
  const wpmStepSize = typingSpeedUnit.historyStepSize;

  // let lastTimestamp = 0;
  Object.keys(activityChartData).forEach((date) => {
    const dateInt = parseInt(date);
    activityChartData_amount.push({
      x: dateInt,
      y: activityChartData[dateInt].amount,
    });
    activityChartData_time.push({
      x: dateInt,
      y: activityChartData[dateInt].time / 60,
      amount: activityChartData[dateInt].amount,
    });
    activityChartData_avgWpm.push({
      x: dateInt,
      y: Misc.roundTo2(
        typingSpeedUnit.fromWpm(activityChartData[dateInt].totalWpm) /
          activityChartData[dateInt].amount
      ),
    });
    // lastTimestamp = date;
  });

  const accountActivityScaleOptions = (
    ChartController.accountActivity.options as ScaleChartOptions<"bar" | "line">
  ).scales;

  const accountActivityAvgWpmOptions = accountActivityScaleOptions[
    "avgWpm"
  ] as LinearScaleOptions;

  accountActivityAvgWpmOptions.title.text = "Average " + Config.typingSpeedUnit;
  accountActivityAvgWpmOptions.ticks.stepSize = wpmStepSize;

  ChartController.accountActivity.data.datasets[0].data =
    activityChartData_time;
  ChartController.accountActivity.data.datasets[1].data =
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
  ChartController.accountHistogram.data.datasets[0].data =
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
      const a = chartData[i];
      if (a.y > currentPb) {
        currentPb = a.y;
        pb.push(a);
      }
    }

    // add last point to pb
    pb.push({
      x: 1,
      y: pb[pb.length - 1].y,
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

    ChartController.accountHistory.data.datasets[0].data = chartData;
    ChartController.accountHistory.data.datasets[1].data = pb;
    ChartController.accountHistory.data.datasets[2].data = accChartData;
    ChartController.accountHistory.data.datasets[3].data = avgTen;
    ChartController.accountHistory.data.datasets[4].data = avgTenAcc;
    ChartController.accountHistory.data.datasets[5].data = avgHundred;
    ChartController.accountHistory.data.datasets[6].data = avgHundredAcc;

    accountHistoryScaleOptions["x"].max = chartData.length + 1;
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

  accountHistoryScaleOptions["pb"].max = maxWpmChartValWithBuffer;
  accountHistoryScaleOptions["wpmAvgTen"].max = maxWpmChartValWithBuffer;
  accountHistoryScaleOptions["wpmAvgHundred"].max = maxWpmChartValWithBuffer;

  if (!Config.startGraphsAtZero) {
    const minWpmChartValFloor =
      Math.floor(minWpmChartVal / wpmStepSize) * wpmStepSize;

    accountHistoryWpmOptions.min = minWpmChartValFloor;
    accountHistoryScaleOptions["pb"].min = minWpmChartValFloor;
    accountHistoryScaleOptions["wpmAvgTen"].min = minWpmChartValFloor;
    accountHistoryScaleOptions["wpmAvgHundred"].min = minWpmChartValFloor;
  } else {
    accountHistoryWpmOptions.min = 0;
    accountHistoryScaleOptions["pb"].min = 0;
    accountHistoryScaleOptions["wpmAvgTen"].min = 0;
    accountHistoryScaleOptions["wpmAvgHundred"].min = 0;
  }

  if (!chartData || chartData.length === 0) {
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
    Misc.secondsToString(Math.round(totalSecondsFiltered), true, true)
  );

  let highestSpeed: number | string = typingSpeedUnit.fromWpm(topWpm);

  if (Config.alwaysShowDecimalPlaces) {
    highestSpeed = Misc.roundTo2(highestSpeed).toFixed(2);
  } else {
    highestSpeed = Math.round(highestSpeed);
  }

  const speedUnit = Config.typingSpeedUnit;

  $(".pageAccount .highestWpm .title").text(`highest ${speedUnit}`);
  $(".pageAccount .highestWpm .val").text(highestSpeed);

  let averageSpeed: number | string = typingSpeedUnit.fromWpm(totalWpm);
  if (Config.alwaysShowDecimalPlaces) {
    averageSpeed = Misc.roundTo2(averageSpeed / testCount).toFixed(2);
  } else {
    averageSpeed = Math.round(averageSpeed / testCount);
  }

  $(".pageAccount .averageWpm .title").text(`average ${speedUnit}`);
  $(".pageAccount .averageWpm .val").text(averageSpeed);

  let averageSpeedLast10: number | string =
    typingSpeedUnit.fromWpm(wpmLast10total);
  if (Config.alwaysShowDecimalPlaces) {
    averageSpeedLast10 = Misc.roundTo2(averageSpeedLast10 / last10).toFixed(2);
  } else {
    averageSpeedLast10 = Math.round(averageSpeedLast10 / last10);
  }

  $(".pageAccount .averageWpm10 .title").text(
    `average ${speedUnit} (last 10 tests)`
  );
  $(".pageAccount .averageWpm10 .val").text(averageSpeedLast10);

  let highestRawSpeed: number | string = typingSpeedUnit.fromWpm(rawWpm.max);
  if (Config.alwaysShowDecimalPlaces) {
    highestRawSpeed = Misc.roundTo2(highestRawSpeed).toFixed(2);
  } else {
    highestRawSpeed = Math.round(highestRawSpeed);
  }

  $(".pageAccount .highestRaw .title").text(`highest raw ${speedUnit}`);
  $(".pageAccount .highestRaw .val").text(highestRawSpeed);

  let averageRawSpeed: number | string = typingSpeedUnit.fromWpm(rawWpm.total);
  if (Config.alwaysShowDecimalPlaces) {
    averageRawSpeed = Misc.roundTo2(averageRawSpeed / rawWpm.count).toFixed(2);
  } else {
    averageRawSpeed = Math.round(averageRawSpeed / rawWpm.count);
  }

  $(".pageAccount .averageRaw .title").text(`average raw ${speedUnit}`);
  $(".pageAccount .averageRaw .val").text(averageRawSpeed);

  let averageRawSpeedLast10: number | string = typingSpeedUnit.fromWpm(
    rawWpm.last10Total
  );
  if (Config.alwaysShowDecimalPlaces) {
    averageRawSpeedLast10 = Misc.roundTo2(
      averageRawSpeedLast10 / rawWpm.last10Count
    ).toFixed(2);
  } else {
    averageRawSpeedLast10 = Math.round(
      averageRawSpeedLast10 / rawWpm.last10Count
    );
  }

  $(".pageAccount .averageRaw10 .title").text(
    `average raw ${speedUnit} (last 10 tests)`
  );
  $(".pageAccount .averageRaw10 .val").text(averageRawSpeedLast10);

  $(".pageAccount .highestWpm .mode").html(topMode);
  $(".pageAccount .testsTaken .val").text(testCount);

  let highestAcc: string | number = topAcc;
  if (Config.alwaysShowDecimalPlaces) {
    highestAcc = Misc.roundTo2(highestAcc).toFixed(2);
  } else {
    highestAcc = Math.floor(highestAcc);
  }

  $(".pageAccount .highestAcc .val").text(highestAcc + "%");

  let averageAcc: number | string = totalAcc;
  if (Config.alwaysShowDecimalPlaces) {
    averageAcc = Misc.roundTo2(averageAcc / testCount);
  } else {
    averageAcc = Math.floor(averageAcc / testCount);
  }

  $(".pageAccount .avgAcc .val").text(averageAcc + "%");

  let averageAccLast10: number | string = totalAcc10;
  if (Config.alwaysShowDecimalPlaces) {
    averageAccLast10 = Misc.roundTo2(averageAccLast10 / last10);
  } else {
    averageAccLast10 = Math.floor(averageAccLast10 / last10);
  }

  $(".pageAccount .avgAcc10 .val").text(averageAccLast10 + "%");

  if (totalCons === 0 || totalCons === undefined) {
    $(".pageAccount .avgCons .val").text("-");
    $(".pageAccount .avgCons10 .val").text("-");
  } else {
    let highestCons: number | string = topCons;
    if (Config.alwaysShowDecimalPlaces) {
      highestCons = Misc.roundTo2(highestCons).toFixed(2);
    } else {
      highestCons = Math.round(highestCons);
    }

    $(".pageAccount .highestCons .val").text(highestCons + "%");

    let averageCons: number | string = totalCons;
    if (Config.alwaysShowDecimalPlaces) {
      averageCons = Misc.roundTo2(averageCons / consCount).toFixed(2);
    } else {
      averageCons = Math.round(averageCons / consCount);
    }

    $(".pageAccount .avgCons .val").text(averageCons + "%");

    let averageConsLast10: number | string = totalCons10;
    if (Config.alwaysShowDecimalPlaces) {
      averageConsLast10 = Misc.roundTo2(
        averageConsLast10 / Math.min(last10, consCount)
      ).toFixed(2);
    } else {
      averageConsLast10 = Math.round(
        averageConsLast10 / Math.min(last10, consCount)
      );
    }

    $(".pageAccount .avgCons10 .val").text(averageConsLast10 + "%");
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

  const trend = Misc.findLineByLeastSquares(wpmPoints);

  const wpmChange = trend[1][1] - trend[0][1];

  const wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);

  const plus = wpmChangePerHour > 0 ? "+" : "";

  $(".pageAccount .group.chart .below .text").text(
    `Speed change per hour spent typing: ${
      plus + Misc.roundTo2(typingSpeedUnit.fromWpm(wpmChangePerHour))
    } ${Config.typingSpeedUnit}`
  );

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
  Misc.swapElements(
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
  if (results === false && !ConnectionState.get()) {
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

  const key = keyString as keyof typeof filteredResults[0];

  // This allows to reverse the sorting order when clicking multiple times on the table header
  let descending = true;
  if (forceDescending !== null) {
    if (forceDescending === true) {
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
    parseInt(filteredResults[0][key] as string) <=
    parseInt(filteredResults[filteredResults.length - 1][key] as string)
  ) {
    descending = true;
    $(headerClass).append(
      '<i class="fas fa-sort-down" aria-hidden="true"></i>'
    );
  } else {
    descending = false;
    $(headerClass).append('<i class="fas fa-sort-up", aria-hidden="true"></i>');
  }

  const temp = [];
  const parsedIndexes: number[] = [];

  while (temp.length < filteredResults.length) {
    let lowest = Number.MAX_VALUE;
    let highest = -1;
    let idx = -1;

    for (let i = 0; i < filteredResults.length; i++) {
      //find the lowest wpm with index not already parsed
      if (!descending) {
        if (
          (filteredResults[i][key] as number) <= lowest &&
          !parsedIndexes.includes(i)
        ) {
          lowest = filteredResults[i][key] as number;
          idx = i;
        }
      } else {
        if (
          (filteredResults[i][key] as number) >= highest &&
          !parsedIndexes.includes(i)
        ) {
          highest = filteredResults[i][key] as number;
          idx = i;
        }
      }
    }

    temp.push(filteredResults[idx]);
    parsedIndexes.push(idx);
  }
  filteredResults = temp;

  $(".pageAccount .history table tbody").empty();
  visibleTableLines = 0;
  loadMoreLines();
}

$(".pageAccount button.toggleResultsOnChart").on("click", () => {
  UpdateConfig.setAccountChartResults(!(Config.accountChart[0] === "on"));
});

$(".pageAccount button.toggleAccuracyOnChart").on("click", () => {
  UpdateConfig.setAccountChartAccuracy(!(Config.accountChart[1] === "on"));
});

$(".pageAccount button.toggleAverage10OnChart").on("click", () => {
  UpdateConfig.setAccountChartAvg10(!(Config.accountChart[2] === "on"));
});

$(".pageAccount button.toggleAverage100OnChart").on("click", () => {
  UpdateConfig.setAccountChartAvg100(!(Config.accountChart[3] === "on"));
});

$(".pageAccount .loadMoreButton").on("click", () => {
  loadMoreLines();
});

$(".pageAccount #accountHistoryChart").on("click", () => {
  const index: number = ChartController.accountHistoryActiveIndex;
  loadMoreLines(index);
  if (!window) return;
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
  MiniResultChart.updateData(
    filteredResults[parseInt(filteredId)].chartData as MonkeyTypes.ChartData
  );
  MiniResultChart.show();
  MiniResultChart.updatePosition(
    event.pageX - ($(".pageAccount .miniResultChartWrapper").outerWidth() ?? 0),
    event.pageY + 30
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
  ".buttonsAndTitle .buttons .button",
  () => {
    // We want to 'force' descending sort:
    sortAndRefreshHistory("timestamp", ".history-date-header", true);
  }
);

$(".pageAccount .group.topFilters, .pageAccount .filterButtons").on(
  "click",
  ".button",
  () => {
    setTimeout(() => {
      update();
    }, 0);
  }
);

$(".pageAccount .group.presetFilterButtons").on(
  "click",
  ".filterBtns .filterPresets .select-filter-preset",
  (e) => {
    ResultFilters.setFilterPreset($(e.target).data("id"));
    update();
  }
);

$(".pageAccount .content .group.aboveHistory .exportCSV").on("click", () => {
  Misc.downloadResultsCSV(filteredResults);
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
  const offset = DB.getSnapshot()?.results?.length || 0;

  Loader.show();
  ResultBatches.disableButton();

  await downloadResults(offset);
  await fillContent();
  Loader.hide();
});

ConfigEvent.subscribe((eventKey) => {
  if (ActivePage.get() === "account" && eventKey === "typingSpeedUnit") {
    update();
  }
});

export const page = new Page(
  "account",
  $(".page.pageAccount"),
  "/account",
  async () => {
    //
  },
  async () => {
    reset();
    ResultFilters.removeButtons();
    Skeleton.remove("pageAccount");
  },
  async () => {
    Skeleton.append("pageAccount", "main");
    await ResultFilters.appendButtons();
    ResultFilters.updateActive();
    await Misc.sleep(0);
    if (DB.getSnapshot()?.results === undefined) {
      $(".pageLoading .fill, .pageAccount .fill").css("width", "0%");
      $(".pageAccount .content").addClass("hidden");
      $(".pageAccount .preloader").removeClass("hidden");
    }

    await update();
    await Misc.sleep(0);
    updateChartColors();
    $(".pageAccount .content p.accountVerificatinNotice").remove();
    if (Auth?.currentUser?.emailVerified === false) {
      $(".pageAccount .content").prepend(
        `<p class="accountVerificatinNotice" style="text-align:center">Your account is not verified. <a class="sendVerificationEmail">Send the verification email again</a>.`
      );
    }

    ResultBatches.showOrHideIfNeeded();
  },
  async () => {
    //
  }
);

$(() => {
  Skeleton.save("pageAccount");
});
