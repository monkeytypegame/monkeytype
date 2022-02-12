// @ts-ignore
import * as DB from "../db";
// @ts-ignore
import * as ResultFilters from "../account/result-filters";
// @ts-ignore
import * as ThemeColors from "../elements/theme-colors";
// @ts-ignore
import * as ChartController from "../controllers/chart-controller";
// @ts-ignore
import Config, * as UpdateConfig from "../config";
// @ts-ignore
import * as MiniResultChart from "../account/mini-result-chart";
// @ts-ignore
import * as AllTimeStats from "../account/all-time-stats";
// @ts-ignore
import * as PbTables from "../account/pb-tables";
// @ts-ignore
import * as LoadingPage from "./loading";
// @ts-ignore
import * as Focus from "../test/focus";
// @ts-ignore
import * as SignOutButton from "../account/sign-out-button";
// @ts-ignore
import * as TodayTracker from "../test/today-tracker";
import * as Notifications from "../elements/notifications";
import Page from "./page";
import * as Misc from "../misc";
import * as Types from "../types/interfaces";

let filterDebug = false;
//toggle filterdebug
export function toggleFilterDebug(): void {
  filterDebug = !filterDebug;
  if (filterDebug) {
    console.log("filterDebug is on");
  }
}

let filteredResults: Types.Result[] = [];
let visibleTableLines = 0;

function loadMoreLines(lineIndex?: number): void {
  if (filteredResults == [] || filteredResults.length == 0) return;
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
    if (diff == undefined) {
      diff = "normal";
    }

    let raw;
    try {
      raw = Config.alwaysShowCPM
        ? (result.rawWpm * 5).toFixed(2)
        : result.rawWpm.toFixed(2);
      if (raw == undefined) {
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
      icons += `<span aria-label="punctuation" data-balloon-pos="up" style="font-weight:900">!?</span>`;
    }

    if (result.numbers) {
      icons += `<span aria-label="numbers" data-balloon-pos="up" style="font-weight:900">15</span>`;
    }

    if (result.blindMode) {
      icons += `<span aria-label="blind mode" data-balloon-pos="up"><i class="fas fa-fw fa-eye-slash"></i></span>`;
    }

    if (result.lazyMode) {
      icons += `<span aria-label="lazy mode" data-balloon-pos="up"><i class="fas fa-fw fa-couch"></i></span>`;
    }

    if (result.funbox !== "none" && result.funbox !== undefined) {
      icons += `<span aria-label="${result.funbox.replace(
        /_/g,
        " "
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
        DB.getSnapshot().tags.forEach((snaptag: Types.Tag) => {
          if (tag === snaptag._id) {
            tagNames += snaptag.name + ", ";
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

    $(".pageAccount .history table tbody").append(`
    <tr class="resultRow" id="result-${i}">
    <td>${pb}</td>
    <td>${(Config.alwaysShowCPM ? result.wpm * 5 : result.wpm).toFixed(2)}</td>
    <td>${raw}</td>
    <td>${result.acc.toFixed(2)}%</td>
    <td>${consistency}</td>
    <td>${charStats}</td>
    <td>${result.mode} ${result.mode2}</td>
    <td class="infoIcons">${icons}</td>
    <td>${tagIcons}</td>
    <td>${moment(result.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
    </tr>`);
  }
  visibleTableLines = newVisibleLines;
  if (visibleTableLines >= filteredResults.length) {
    $(".pageAccount .loadMoreButton").addClass("hidden");
  } else {
    $(".pageAccount .loadMoreButton").removeClass("hidden");
  }
}

export function reset(): void {
  $(".pageAccount .history table tbody").empty();
  ChartController.accountActivity.data.datasets[0].data = [];
  ChartController.accountActivity.data.datasets[1].data = [];
  ChartController.accountHistory.data.datasets[0].data = [];
  ChartController.accountHistory.data.datasets[1].data = [];
  ChartController.accountActivity.update({ duration: 0 });
  ChartController.accountHistory.update({ duration: 0 });
}

let totalSecondsFiltered = 0;

export function update(): void {
  function cont(): void {
    LoadingPage.updateText("Displaying stats...");
    LoadingPage.updateBar(100);
    console.log("updating account page");
    ThemeColors.update();
    ChartController.accountHistory.updateColors();
    ChartController.accountActivity.updateColors();
    AllTimeStats.update();

    PbTables.update();

    type ChartData = {
      x: number;
      y: number;
      acc: number;
      mode: string;
      mode2: string | number;
      punctuation: boolean;
      language: string;
      timestamp: number;
      difficulty: string;
      raw: number;
    };

    type AccChartData = {
      x: number;
      y: number;
    };

    const chartData: ChartData[] = [];
    const wpmChartData: number[] = [];
    const accChartData: AccChartData[] = [];
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

    // let totalSeconds = 0;
    totalSecondsFiltered = 0;

    let topCons = 0;
    let totalCons = 0;
    let totalCons10 = 0;
    let consCount = 0;

    type ActivityChartData = {
      [key: number]: {
        amount: number;
        time: number;
        totalWpm: number;
      };
    };

    const activityChartData: ActivityChartData = {};

    filteredResults = [];
    $(".pageAccount .history table tbody").empty();
    DB.getSnapshot().results.forEach((result: Types.Result) => {
      // totalSeconds += tt;

      //apply filters
      try {
        let resdiff = result.difficulty;
        if (resdiff == undefined) {
          resdiff = "normal";
        }
        if (!ResultFilters.getFilter("difficulty", resdiff)) {
          if (filterDebug)
            console.log(`skipping result due to difficulty filter`, result);
          return;
        }
        if (!ResultFilters.getFilter("mode", result.mode)) {
          if (filterDebug)
            console.log(`skipping result due to mode filter`, result);
          return;
        }

        if (result.mode == "time") {
          let timefilter = "custom";
          if ([15, 30, 60, 120].includes(result.mode2 as number)) {
            timefilter = result.mode2.toString();
          }
          if (!ResultFilters.getFilter("time", timefilter)) {
            if (filterDebug)
              console.log(`skipping result due to time filter`, result);
            return;
          }
        } else if (result.mode == "words") {
          let wordfilter = "custom";
          if ([10, 25, 50, 100, 200].includes(result.mode2 as number)) {
            wordfilter = result.mode2.toString();
          }
          if (!ResultFilters.getFilter("words", wordfilter)) {
            if (filterDebug)
              console.log(`skipping result due to word filter`, result);
            return;
          }
        }

        if (result.quoteLength != null) {
          let filter = null;
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
            filter !== null &&
            !ResultFilters.getFilter("quoteLength", filter)
          ) {
            if (filterDebug)
              console.log(`skipping result due to quoteLength filter`, result);
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
          if (filterDebug)
            console.log(`skipping result due to language filter`, result);
          return;
        }

        let puncfilter = "off";
        if (result.punctuation) {
          puncfilter = "on";
        }
        if (!ResultFilters.getFilter("punctuation", puncfilter)) {
          if (filterDebug)
            console.log(`skipping result due to punctuation filter`, result);
          return;
        }

        let numfilter = "off";
        if (result.numbers) {
          numfilter = "on";
        }
        if (!ResultFilters.getFilter("numbers", numfilter)) {
          if (filterDebug)
            console.log(`skipping result due to numbers filter`, result);
          return;
        }

        if (result.funbox === "none" || result.funbox === undefined) {
          if (!ResultFilters.getFilter("funbox", "none")) {
            if (filterDebug)
              console.log(`skipping result due to funbox filter`, result);
            return;
          }
        } else {
          if (!ResultFilters.getFilter("funbox", result.funbox)) {
            if (filterDebug)
              console.log(`skipping result due to funbox filter`, result);
            return;
          }
        }

        let tagHide = true;
        if (result.tags === undefined || result.tags.length === 0) {
          //no tags, show when no tag is enabled
          if (DB.getSnapshot().tags.length > 0) {
            if (ResultFilters.getFilter("tags", "none")) tagHide = false;
          } else {
            tagHide = false;
          }
        } else {
          //tags exist
          const validTags: string[] = DB.getSnapshot().tags.map(
            (t: Types.Tag) => t._id
          );
          result.tags.forEach((tag) => {
            //check if i even need to check tags anymore
            if (!tagHide) return;
            //check if tag is valid
            if (validTags.includes(tag)) {
              //tag valid, check if filter is on
              if (ResultFilters.getFilter("tags", tag)) tagHide = false;
            } else {
              //tag not found in valid tags, meaning probably deleted
              if (ResultFilters.getFilter("tags", "none")) tagHide = false;
            }
          });
        }

        if (tagHide) {
          if (filterDebug)
            console.log(`skipping result due to tag filter`, result);
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
          if (filterDebug)
            console.log(`skipping result due to date filter`, result);
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

      let tt = 0;
      if (
        result.testDuration == undefined &&
        result.mode2 !== "custom" &&
        result.mode2 !== "zen"
      ) {
        //test finished before testDuration field was introduced - estimate
        if (result.mode == "time") {
          tt = result.mode2;
        } else if (result.mode == "words") {
          tt = (result.mode2 / result.wpm) * 60;
        }
      } else {
        tt = result.testDuration;
      }
      if (result.incompleteTestSeconds != undefined) {
        tt += result.incompleteTestSeconds;
      } else if (result.restartCount != undefined && result.restartCount > 0) {
        tt += (tt / 4) * result.restartCount;
      }

      // if (result.incompleteTestSeconds != undefined) {
      //   tt += result.incompleteTestSeconds;
      // } else if (result.restartCount != undefined && result.restartCount > 0) {
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

      if (result.rawWpm != null) {
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

      if (result.restartCount != undefined) {
        testRestarts += result.restartCount;
      }

      chartData.push({
        x: result.timestamp,
        y: Config.alwaysShowCPM ? Misc.roundTo2(result.wpm * 5) : result.wpm,
        acc: result.acc,
        mode: result.mode,
        mode2: result.mode2,
        punctuation: result.punctuation as boolean,
        language: result.language,
        timestamp: result.timestamp,
        difficulty: result.difficulty,
        raw: Config.alwaysShowCPM
          ? Misc.roundTo2(result.rawWpm * 5)
          : result.rawWpm,
      });

      wpmChartData.push(result.wpm);

      accChartData.push({
        x: result.timestamp,
        y: 100 - result.acc,
      });

      if (result.wpm > topWpm) {
        const puncsctring = result.punctuation ? ",<br>with punctuation" : "";
        const numbsctring = result.numbers
          ? ",<br> " + (result.punctuation ? "&" : "") + "with numbers"
          : "";
        topWpm = result.wpm;
        if (result.mode == "custom") topMode = result.mode;
        else
          topMode =
            result.mode + " " + result.mode2 + puncsctring + numbsctring;
      }

      totalWpm += result.wpm;
    });

    if (Config.alwaysShowCPM) {
      $(".pageAccount .group.history table thead tr td:nth-child(2)").text(
        "cpm"
      );
    } else {
      $(".pageAccount .group.history table thead tr td:nth-child(2)").text(
        "wpm"
      );
    }

    loadMoreLines();
    ////////

    type ActivityChartDataPoint = {
      x: number;
      y: number;
      amount?: number;
    };

    const activityChartData_amount: ActivityChartDataPoint[] = [];
    const activityChartData_time: ActivityChartDataPoint[] = [];
    const activityChartData_avgWpm: ActivityChartDataPoint[] = [];
    // let lastTimestamp = 0;
    Object.keys(activityChartData).forEach((date) => {
      const dateInt = parseInt(date);
      activityChartData_amount.push({
        x: dateInt,
        y: activityChartData[dateInt].amount,
      });
      activityChartData_time.push({
        x: dateInt,
        y: Misc.roundTo2(activityChartData[dateInt].time),
        amount: activityChartData[dateInt].amount,
      });
      activityChartData_avgWpm.push({
        x: dateInt,
        y: Misc.roundTo2(
          (Config.alwaysShowCPM
            ? activityChartData[dateInt].totalWpm * 5
            : activityChartData[dateInt].totalWpm) /
            activityChartData[dateInt].amount
        ),
      });
      // lastTimestamp = date;
    });

    if (Config.alwaysShowCPM) {
      ChartController.accountActivity.options.scales.yAxes[1].scaleLabel.labelString =
        "Average Cpm";
    } else {
      ChartController.accountActivity.options.scales.yAxes[1].scaleLabel.labelString =
        "Average Wpm";
    }

    ChartController.accountActivity.data.datasets[0].data = activityChartData_time;
    ChartController.accountActivity.data.datasets[1].data = activityChartData_avgWpm;

    if (Config.alwaysShowCPM) {
      ChartController.accountHistory.options.scales.yAxes[0].scaleLabel.labelString =
        "Characters per Minute";
    } else {
      ChartController.accountHistory.options.scales.yAxes[0].scaleLabel.labelString =
        "Words per Minute";
    }

    ChartController.accountHistory.data.datasets[0].data = chartData;
    ChartController.accountHistory.data.datasets[1].data = accChartData;

    const wpms = chartData.map((r) => r.y);
    const minWpmChartVal = Math.min(...wpms);
    const maxWpmChartVal = Math.max(...wpms);

    // let accuracies = accChartData.map((r) => r.y);
    ChartController.accountHistory.options.scales.yAxes[0].ticks.max =
      Math.floor(maxWpmChartVal) + (10 - (Math.floor(maxWpmChartVal) % 10));

    if (!Config.startGraphsAtZero) {
      ChartController.accountHistory.options.scales.yAxes[0].ticks.min = Math.floor(
        minWpmChartVal
      );
    } else {
      ChartController.accountHistory.options.scales.yAxes[0].ticks.min = 0;
    }

    if (chartData == [] || chartData.length == 0) {
      $(".pageAccount .group.noDataError").removeClass("hidden");
      $(".pageAccount .group.chart").addClass("hidden");
      $(".pageAccount .group.dailyActivityChart").addClass("hidden");
      $(".pageAccount .group.history").addClass("hidden");
      $(".pageAccount .triplegroup.stats").addClass("hidden");
    } else {
      $(".pageAccount .group.noDataError").addClass("hidden");
      $(".pageAccount .group.chart").removeClass("hidden");
      $(".pageAccount .group.dailyActivityChart").removeClass("hidden");
      $(".pageAccount .group.history").removeClass("hidden");
      $(".pageAccount .triplegroup.stats").removeClass("hidden");
    }

    $(".pageAccount .timeTotalFiltered .val").text(
      Misc.secondsToString(Math.round(totalSecondsFiltered), true, true)
    );

    if (Config.alwaysShowCPM) {
      $(".pageAccount .highestWpm .title").text("highest cpm");
      $(".pageAccount .highestWpm .val").text(Misc.roundTo2(topWpm * 5));
    } else {
      $(".pageAccount .highestWpm .title").text("highest wpm");
      $(".pageAccount .highestWpm .val").text(Misc.roundTo2(topWpm));
    }

    if (Config.alwaysShowCPM) {
      $(".pageAccount .averageWpm .title").text("average cpm");
      $(".pageAccount .averageWpm .val").text(
        Math.round((totalWpm * 5) / testCount)
      );
    } else {
      $(".pageAccount .averageWpm .title").text("average wpm");
      $(".pageAccount .averageWpm .val").text(Math.round(totalWpm / testCount));
    }

    if (Config.alwaysShowCPM) {
      $(".pageAccount .averageWpm10 .title").text(
        "average cpm (last 10 tests)"
      );
      $(".pageAccount .averageWpm10 .val").text(
        Math.round((wpmLast10total * 5) / last10)
      );
    } else {
      $(".pageAccount .averageWpm10 .title").text(
        "average wpm (last 10 tests)"
      );
      $(".pageAccount .averageWpm10 .val").text(
        Math.round(wpmLast10total / last10)
      );
    }

    if (Config.alwaysShowCPM) {
      $(".pageAccount .highestRaw .title").text("highest raw cpm");
      $(".pageAccount .highestRaw .val").text(Misc.roundTo2(rawWpm.max * 5));
    } else {
      $(".pageAccount .highestRaw .title").text("highest raw wpm");
      $(".pageAccount .highestRaw .val").text(Misc.roundTo2(rawWpm.max));
    }

    if (Config.alwaysShowCPM) {
      $(".pageAccount .averageRaw .title").text("average raw cpm");
      $(".pageAccount .averageRaw .val").text(
        Math.round((rawWpm.total * 5) / rawWpm.count)
      );
    } else {
      $(".pageAccount .averageRaw .title").text("average raw wpm");
      $(".pageAccount .averageRaw .val").text(
        Math.round(rawWpm.total / rawWpm.count)
      );
    }

    if (Config.alwaysShowCPM) {
      $(".pageAccount .averageRaw10 .title").text(
        "average raw cpm (last 10 tests)"
      );
      $(".pageAccount .averageRaw10 .val").text(
        Math.round((rawWpm.last10Total * 5) / rawWpm.last10Count)
      );
    } else {
      $(".pageAccount .averageRaw10 .title").text(
        "average raw wpm (last 10 tests)"
      );
      $(".pageAccount .averageRaw10 .val").text(
        Math.round(rawWpm.last10Total / rawWpm.last10Count)
      );
    }

    $(".pageAccount .highestWpm .mode").html(topMode);
    $(".pageAccount .testsTaken .val").text(testCount);

    $(".pageAccount .highestAcc .val").text(topAcc + "%");
    $(".pageAccount .avgAcc .val").text(Math.round(totalAcc / testCount) + "%");
    $(".pageAccount .avgAcc10 .val").text(
      Math.round(totalAcc10 / last10) + "%"
    );

    if (totalCons == 0 || totalCons == undefined) {
      $(".pageAccount .avgCons .val").text("-");
      $(".pageAccount .avgCons10 .val").text("-");
    } else {
      $(".pageAccount .highestCons .val").text(topCons + "%");
      $(".pageAccount .avgCons .val").text(
        Math.round(totalCons / consCount) + "%"
      );
      $(".pageAccount .avgCons10 .val").text(
        Math.round(totalCons10 / Math.min(last10, consCount)) + "%"
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

    if (ChartController.accountHistory.data.datasets[0].data.length > 0) {
      ChartController.accountHistory.options.plugins.trendlineLinear = true;
    } else {
      ChartController.accountHistory.options.plugins.trendlineLinear = false;
    }

    if (ChartController.accountActivity.data.datasets[0].data.length > 0) {
      ChartController.accountActivity.options.plugins.trendlineLinear = true;
    } else {
      ChartController.accountActivity.options.plugins.trendlineLinear = false;
    }

    const wpmPoints = filteredResults.map((r) => r.wpm).reverse();

    const trend = Misc.findLineByLeastSquares(wpmPoints);

    const wpmChange = trend[1][1] - trend[0][1];

    const wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);

    const plus = wpmChangePerHour > 0 ? "+" : "";

    $(".pageAccount .group.chart .below .text").text(
      `Speed change per hour spent typing: ${
        plus +
        Misc.roundTo2(
          Config.alwaysShowCPM ? wpmChangePerHour * 5 : wpmChangePerHour
        )
      } ${Config.alwaysShowCPM ? "cpm" : "wpm"}.`
    );

    ChartController.accountHistory.update({ duration: 0 });
    ChartController.accountActivity.update({ duration: 0 });
    LoadingPage.updateBar(100, true);
    setTimeout(() => {
      SignOutButton.show();
    }, 125);
    Focus.set(false);
    Misc.swapElements(
      $(".pageAccount .preloader"),
      $(".pageAccount .content"),
      250
    );
  }
  if (DB.getSnapshot() === null) {
    Notifications.add(`Missing account data. Please refresh.`, -1);
    $(".pageAccount .preloader").html("Missing account data. Please refresh.");
  } else if (DB.getSnapshot().results === undefined) {
    LoadingPage.updateBar(45, true);
    DB.getUserResults().then((d: boolean) => {
      TodayTracker.addAllFromToday();
      if (d) {
        ResultFilters.updateActive();
        update();
      }
    });
  } else {
    console.log("using db snap");
    try {
      cont();
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
  $("td").removeClass("header-sorted");
  $("td").children("i").remove();
  $(headerClass).addClass("header-sorted");

  if (filteredResults.length < 2) return;

  const key = keyString as keyof typeof filteredResults[0];

  if (typeof filteredResults[0][key] !== "string") return;

  // This allows to reverse the sorting order when clicking multiple times on the table header
  let descending = true;
  if (forceDescending !== null) {
    if (forceDescending == true) {
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

$(".pageAccount .toggleAccuracyOnChart").click(() => {
  UpdateConfig.setChartAccuracy(!Config.chartAccuracy);
});

$(".pageAccount .toggleChartStyle").click(() => {
  if (Config.chartStyle == "line") {
    UpdateConfig.setChartStyle("scatter");
  } else {
    UpdateConfig.setChartStyle("line");
  }
});

$(".pageAccount .loadMoreButton").click(() => {
  loadMoreLines();
});

$(".pageAccount #accountHistoryChart").click(() => {
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

$(document).on("click", ".pageAccount .miniResultChartButton", (event) => {
  console.log("updating");
  const filteredId = $(event.currentTarget).attr("filteredResultsId");
  if (filteredId === undefined) return;
  MiniResultChart.updateData(filteredResults[parseInt(filteredId)].chartData);
  MiniResultChart.show();
  MiniResultChart.updatePosition(
    event.pageX - ($(".pageAccount .miniResultChartWrapper").outerWidth() ?? 0),
    event.pageY + 30
  );
});

$(document).on("click", ".history-wpm-header", () => {
  sortAndRefreshHistory("wpm", ".history-wpm-header");
});

$(document).on("click", ".history-raw-header", () => {
  sortAndRefreshHistory("rawWpm", ".history-raw-header");
});

$(document).on("click", ".history-acc-header", () => {
  sortAndRefreshHistory("acc", ".history-acc-header");
});

$(document).on("click", ".history-correct-chars-header", () => {
  sortAndRefreshHistory("correctChars", ".history-correct-chars-header");
});

$(document).on("click", ".history-incorrect-chars-header", () => {
  sortAndRefreshHistory("incorrectChars", ".history-incorrect-chars-header");
});

$(document).on("click", ".history-consistency-header", () => {
  sortAndRefreshHistory("consistency", ".history-consistency-header");
});

$(document).on("click", ".history-date-header", () => {
  sortAndRefreshHistory("timestamp", ".history-date-header");
});

// Resets sorting to by date' when applying filers (normal or advanced)
$(document).on("click", ".buttonsAndTitle .buttons .button", () => {
  // We want to 'force' descending sort:
  sortAndRefreshHistory("timestamp", ".history-date-header", true);
});

$(
  ".pageAccount .topFilters .button, .pageAccount .filterButtons .button "
).click(() => {
  setTimeout(() => {
    update();
  }, 0);
});

export const page = new Page(
  "account",
  $(".page.pageAccount"),
  "/account",
  () => {
    SignOutButton.hide();
  },
  async () => {
    reset();
  },
  () => {
    update();
    // SignOutButton.show();
  },
  () => {
    //
  }
);
