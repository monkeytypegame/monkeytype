import * as DB from "./db";
import * as Misc from "./misc";
import * as CloudFunctions from "./cloud-functions";
import * as Notifications from "./notifications";
import * as ResultFilters from "./result-filters";
import * as ThemeColors from "./theme-colors";
import * as ChartController from "./chart-controller";
import Config, * as UpdateConfig from "./config";
import * as AccountButton from "./account-button";
import * as TestLogic from "./test-logic";
import * as PaceCaret from "./pace-caret";
import * as TagController from "./tag-controller";
import * as UI from "./ui";
import * as CommandlineLists from "./commandline-lists";
import * as MiniResultChart from "./mini-result-chart";
import * as ResultTagsPopup from "./result-tags-popup";
import * as Settings from "./settings";
import * as ThemePicker from "./theme-picker";
import * as AllTimeStats from "./all-time-stats";
import * as PbTables from "./pb-tables";

export function getDataAndInit() {
  DB.initSnapshot()
    .then(async (e) => {
      let snap = DB.getSnapshot();
      if (snap === null) {
        throw "Missing db snapshot. Client likely could not connect to the backend.";
      }
      let user = firebase.auth().currentUser;
      if (snap.name === undefined) {
        //verify username
        if (Misc.isUsernameValid(user.displayName)) {
          //valid, just update
          snap.name = user.displayName;
          DB.setSnapshot(snap);
          DB.updateName(user.uid, user.displayName);
        } else {
          //invalid, get new
          // Notifications.add("Invalid name", 0);
          let promptVal = null;
          let cdnVal = undefined;

          while (
            promptVal === null ||
            cdnVal === undefined ||
            cdnVal.data.status < 0
          ) {
            promptVal = prompt(
              "Your name is either invalid or unavailable (you also need to do this if you used Google Sign Up). Please provide a new display name (cannot be longer than 14 characters, can only contain letters, numbers, underscores, dots and dashes):"
            );
            cdnVal = await CloudFunctions.changeDisplayName({
              uid: user.uid,
              name: promptVal,
            });
            if (cdnVal.data.status === 1) {
              alert("Name updated", 1);
              location.reload();
            } else if (cdnVal.data.status < 0) {
              alert(cdnVal.data.message, 0);
            }
          }
        }
      }
      if (snap.refactored === false) {
        CloudFunctions.removeSmallTests({ uid: user.uid });
      }
      if (!UpdateConfig.changedBeforeDb) {
        if (Config.localStorageConfig === null) {
          AccountButton.loading(false);
          UpdateConfig.apply(DB.getSnapshot().config);
          Settings.update();
          UpdateConfig.saveToLocalStorage(true);
          TestLogic.restart(false, true);
        } else if (DB.getSnapshot().config !== undefined) {
          //loading db config, keep for now
          let configsDifferent = false;
          Object.keys(Config).forEach((key) => {
            if (!configsDifferent) {
              try {
                if (key !== "resultFilters") {
                  if (Array.isArray(Config[key])) {
                    Config[key].forEach((arrval, index) => {
                      if (arrval != DB.getSnapshot().config[key][index]) {
                        configsDifferent = true;
                        console.log(
                          `.config is different: ${arrval} != ${
                            DB.getSnapshot().config[key][index]
                          }`
                        );
                      }
                    });
                  } else {
                    if (Config[key] != DB.getSnapshot().config[key]) {
                      configsDifferent = true;
                      console.log(
                        `..config is different ${key}: ${Config[key]} != ${
                          DB.getSnapshot().config[key]
                        }`
                      );
                    }
                  }
                }
              } catch (e) {
                console.log(e);
                configsDifferent = true;
                console.log(`...config is different: ${e.message}`);
              }
            }
          });
          if (configsDifferent) {
            console.log("applying config from db");
            AccountButton.loading(false);
            UpdateConfig.apply(DB.getSnapshot().config);
            Settings.update();
            UpdateConfig.saveToLocalStorage(true);
            TestLogic.restart(false, true);
          }
        }
        UpdateConfig.setDbConfigLoaded(true);
      } else {
        AccountButton.loading(false);
      }
      if (Config.paceCaret === "pb" || Config.paceCaret === "average") {
        if (!TestLogic.active) {
          PaceCaret.init(true);
        }
      }
      if (
        $(".pageLogin").hasClass("active") ||
        window.location.pathname === "/account"
      ) {
        UI.changePage("account");
      }
      ThemePicker.refreshButtons();
      AccountButton.loading(false);
      ResultFilters.updateTags();
      CommandlineLists.updateTagCommands();
      TagController.loadActiveFromLocalStorage();
      ResultTagsPopup.updateButtons();
      Settings.showAccountSection();
    })
    .catch((e) => {
      AccountButton.loading(false);
      console.error(e);
      Notifications.add(
        "Error downloading user data. Client likely could not connect to the backend  - refresh to try again. If error persists try clearing your cache and website data or contact Miodec.",
        -1
      );
      $("#top #menu .account .icon").html('<i class="fas fa-fw fa-times"></i>');
      $("#top #menu .account").css("opacity", 1);
    });
}

let filteredResults = [];
let visibleTableLines = 0;

function loadMoreLines() {
  if (filteredResults == [] || filteredResults.length == 0) return;
  for (let i = visibleTableLines; i < visibleTableLines + 10; i++) {
    const result = filteredResults[i];
    if (result == undefined) continue;
    let withpunc = "";
    let diff = result.difficulty;
    if (diff == undefined) {
      diff = "normal";
    }

    let raw;
    try {
      raw = result.rawWpm.toFixed(2);
      if (raw == undefined) {
        raw = "-";
      }
    } catch (e) {
      raw = "-";
    }

    let icons = `<span aria-label="${result.language.replace(
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
        DB.getSnapshot().tags.forEach((snaptag) => {
          if (tag === snaptag.id) {
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

    let tagIcons = `<span id="resultEditTags" resultId="${result.id}" tags='${restags}' aria-label="no tags" data-balloon-pos="up" style="opacity: .25"><i class="fas fa-fw fa-tag"></i></span>`;

    if (tagNames !== "") {
      if (result.tags !== undefined && result.tags.length > 1) {
        tagIcons = `<span id="resultEditTags" resultId="${result.id}" tags='${restags}' aria-label="${tagNames}" data-balloon-pos="up"><i class="fas fa-fw fa-tags"></i></span>`;
      } else {
        tagIcons = `<span id="resultEditTags" resultId="${result.id}" tags='${restags}' aria-label="${tagNames}" data-balloon-pos="up"><i class="fas fa-fw fa-tag"></i></span>`;
      }
    }

    let consistency = result.consistency;

    if (consistency === undefined) {
      consistency = "-";
    } else {
      consistency = consistency.toFixed(2) + "%";
    }

    let pb = result.isPb;
    if (pb) {
      pb = '<i class="fas fa-fw fa-crown"></i>';
    } else {
      pb = "";
    }

    $(".pageAccount .history table tbody").append(`
    <tr>
    <td>${pb}</td>
    <td>${result.wpm.toFixed(2)}</td>
    <td>${raw}</td>
    <td>${result.acc.toFixed(2)}%</td>
    <td>${result.correctChars}</td>
    <td>${result.incorrectChars}</td>
    <td>${consistency}</td>
    <td>${result.mode} ${result.mode2}${withpunc}</td>
    <td class="infoIcons">${icons}</td>
    <td>${tagIcons}</td>
    <td>${moment(result.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
    </tr>`);
  }
  visibleTableLines += 10;
  if (visibleTableLines >= filteredResults.length) {
    $(".pageAccount .loadMoreButton").addClass("hidden");
  } else {
    $(".pageAccount .loadMoreButton").removeClass("hidden");
  }
}

let totalSecondsFiltered = 0;

export function update() {
  function cont() {
    ThemeColors.update();
    ChartController.accountHistory.updateColors();
    ChartController.accountActivity.updateColors();
    AllTimeStats.update();
    PbTables.update();

    let chartData = [];
    let wpmChartData = [];
    let accChartData = [];
    visibleTableLines = 0;

    let topWpm = 0;
    let topMode = "";
    let testRestarts = 0;
    let totalWpm = 0;
    let testCount = 0;

    let last10 = 0;
    let wpmLast10total = 0;

    let totalAcc = 0;
    let totalAcc10 = 0;

    let rawWpm = {
      total: 0,
      count: 0,
      last10Total: 0,
      last10Count: 0,
      max: 0,
    };

    let totalSeconds = 0;
    totalSecondsFiltered = 0;

    let totalCons = 0;
    let totalCons10 = 0;
    let consCount = 0;

    let activityChartData = {};

    filteredResults = [];
    $(".pageAccount .history table tbody").empty();
    DB.getSnapshot().results.forEach((result) => {
      let tt = 0;
      if (result.testDuration == undefined) {
        //test finished before testDuration field was introduced - estimate
        if (result.mode == "time") {
          tt = parseFloat(result.mode2);
        } else if (result.mode == "words") {
          tt = (parseFloat(result.mode2) / parseFloat(result.wpm)) * 60;
        }
      } else {
        tt = parseFloat(result.testDuration);
      }
      if (result.incompleteTestSeconds != undefined) {
        tt += result.incompleteTestSeconds;
      } else if (result.restartCount != undefined && result.restartCount > 0) {
        tt += (tt / 4) * result.restartCount;
      }
      totalSeconds += tt;

      //apply filters
      try {
        let resdiff = result.difficulty;
        if (resdiff == undefined) {
          resdiff = "normal";
        }
        if (!ResultFilters.getFilter("difficulty", resdiff)) return;
        if (!ResultFilters.getFilter("mode", result.mode)) return;

        if (result.mode == "time") {
          let timefilter = "custom";
          if ([15, 30, 60, 120].includes(parseInt(result.mode2))) {
            timefilter = result.mode2;
          }
          if (!ResultFilters.getFilter("time", timefilter)) return;
        } else if (result.mode == "words") {
          let wordfilter = "custom";
          if ([10, 25, 50, 100, 200].includes(parseInt(result.mode2))) {
            wordfilter = result.mode2;
          }
          if (!ResultFilters.getFilter("words", wordfilter)) return;
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
          )
            return;
        }

        let langFilter = ResultFilters.getFilter("language", result.language);

        if (
          result.language === "english_expanded" &&
          ResultFilters.getFilter("language", "english_1k")
        ) {
          langFilter = true;
        }
        if (!langFilter) return;

        let puncfilter = "off";
        if (result.punctuation) {
          puncfilter = "on";
        }
        if (!ResultFilters.getFilter("punctuation", puncfilter)) return;

        let numfilter = "off";
        if (result.numbers) {
          numfilter = "on";
        }
        if (!ResultFilters.getFilter("numbers", numfilter)) return;

        if (result.funbox === "none" || result.funbox === undefined) {
          if (!ResultFilters.getFilter("funbox", "none")) return;
        } else {
          if (!ResultFilters.getFilter("funbox", result.funbox)) return;
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
          let validTags = DB.getSnapshot().tags.map((t) => t.id);
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

        if (tagHide) return;

        let timeSinceTest = Math.abs(result.timestamp - Date.now()) / 1000;

        let datehide = true;

        if (
          ResultFilters.getFilter("date", "all") ||
          (ResultFilters.getFilter("date", "last_day") &&
            timeSinceTest <= 86400) ||
          (ResultFilters.getFilter("date", "last_week") &&
            timeSinceTest <= 604800) ||
          (ResultFilters.getFilter("date", "last_month") &&
            timeSinceTest <= 2592000)
        ) {
          datehide = false;
        }

        if (datehide) return;

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
      }

      //filters done
      //=======================================

      let resultDate = new Date(result.timestamp);
      resultDate.setSeconds(0);
      resultDate.setMinutes(0);
      resultDate.setHours(0);
      resultDate.setMilliseconds(0);
      resultDate = resultDate.getTime();

      if (Object.keys(activityChartData).includes(String(resultDate))) {
        activityChartData[resultDate].amount++;
        activityChartData[resultDate].time +=
          result.testDuration + result.incompleteTestSeconds;
        activityChartData[resultDate].totalWpm += result.wpm;
      } else {
        activityChartData[resultDate] = {
          amount: 1,
          time: result.testDuration + result.incompleteTestSeconds,
          totalWpm: result.wpm,
        };
      }

      tt = 0;
      if (result.testDuration == undefined) {
        //test finished before testDuration field was introduced - estimate
        if (result.mode == "time") {
          tt = parseFloat(result.mode2);
        } else if (result.mode == "words") {
          tt = (parseFloat(result.mode2) / parseFloat(result.wpm)) * 60;
        }
      } else {
        tt = parseFloat(result.testDuration);
      }
      if (result.incompleteTestSeconds != undefined) {
        tt += result.incompleteTestSeconds;
      } else if (result.restartCount != undefined && result.restartCount > 0) {
        tt += (tt / 4) * result.restartCount;
      }
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

      totalAcc += result.acc;

      if (result.restartCount != undefined) {
        testRestarts += result.restartCount;
      }

      chartData.push({
        x: result.timestamp,
        y: result.wpm,
        acc: result.acc,
        mode: result.mode,
        mode2: result.mode2,
        punctuation: result.punctuation,
        language: result.language,
        timestamp: result.timestamp,
        difficulty: result.difficulty,
        raw: result.rawWpm,
      });

      wpmChartData.push(result.wpm);

      accChartData.push({
        x: result.timestamp,
        y: 100 - result.acc,
      });

      if (result.wpm > topWpm) {
        let puncsctring = result.punctuation ? ",<br>with punctuation" : "";
        let numbsctring = result.numbers
          ? ",<br> " + (result.punctuation ? "&" : "") + "with numbers"
          : "";
        topWpm = result.wpm;
        topMode = result.mode + " " + result.mode2 + puncsctring + numbsctring;
      }

      totalWpm += result.wpm;
    });
    loadMoreLines();
    ////////

    let thisDate = new Date(Date.now());
    thisDate.setSeconds(0);
    thisDate.setMinutes(0);
    thisDate.setHours(0);
    thisDate.setMilliseconds(0);
    thisDate = thisDate.getTime();

    let activityChartData_amount = [];
    let activityChartData_time = [];
    let activityChartData_avgWpm = [];
    let lastTimestamp = 0;
    Object.keys(activityChartData).forEach((date) => {
      let datecheck;
      if (lastTimestamp > 0) {
        datecheck = lastTimestamp;
      } else {
        datecheck = thisDate;
      }

      let numDaysBetweenTheDays = (datecheck - date) / 86400000;

      if (numDaysBetweenTheDays > 1) {
        if (datecheck === thisDate) {
          activityChartData_amount.push({
            x: parseInt(thisDate),
            y: 0,
          });
        }

        for (let i = 0; i < numDaysBetweenTheDays - 1; i++) {
          activityChartData_amount.push({
            x: parseInt(datecheck) - 86400000 * (i + 1),
            y: 0,
          });
        }
      }

      activityChartData_amount.push({
        x: parseInt(date),
        y: activityChartData[date].amount,
      });
      activityChartData_time.push({
        x: parseInt(date),
        y: Misc.roundTo2(activityChartData[date].time),
        amount: activityChartData[date].amount,
      });
      activityChartData_avgWpm.push({
        x: parseInt(date),
        y: Misc.roundTo2(
          activityChartData[date].totalWpm / activityChartData[date].amount
        ),
      });
      lastTimestamp = date;
    });

    ChartController.accountActivity.data.datasets[0].data = activityChartData_time;
    ChartController.accountActivity.data.datasets[1].data = activityChartData_avgWpm;

    ChartController.accountHistory.data.datasets[0].data = chartData;
    ChartController.accountHistory.data.datasets[1].data = accChartData;

    let wpms = chartData.map((r) => r.y);
    let minWpmChartVal = Math.min(...wpms);
    let maxWpmChartVal = Math.max(...wpms);

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

    let th = Math.floor(totalSeconds / 3600);
    let tm = Math.floor((totalSeconds % 3600) / 60);
    let ts = Math.floor((totalSeconds % 3600) % 60);
    $(".pageAccount .timeTotal .val").text(`

      ${th < 10 ? "0" + th : th}:${tm < 10 ? "0" + tm : tm}:${
      ts < 10 ? "0" + ts : ts
    }
    `);
    let tfh = Math.floor(totalSecondsFiltered / 3600);
    let tfm = Math.floor((totalSecondsFiltered % 3600) / 60);
    let tfs = Math.floor((totalSecondsFiltered % 3600) % 60);
    $(".pageAccount .timeTotalFiltered .val").text(`

    ${tfh < 10 ? "0" + tfh : tfh}:${tfm < 10 ? "0" + tfm : tfm}:${
      tfs < 10 ? "0" + tfs : tfs
    }
  `);

    $(".pageAccount .highestWpm .val").text(topWpm);
    $(".pageAccount .averageWpm .val").text(Math.round(totalWpm / testCount));
    $(".pageAccount .averageWpm10 .val").text(
      Math.round(wpmLast10total / last10)
    );

    $(".pageAccount .highestRaw .val").text(rawWpm.max);
    $(".pageAccount .averageRaw .val").text(
      Math.round(rawWpm.total / rawWpm.count)
    );
    $(".pageAccount .averageRaw10 .val").text(
      Math.round(rawWpm.last10Total / rawWpm.last10Count)
    );

    $(".pageAccount .highestWpm .mode").html(topMode);
    $(".pageAccount .testsTaken .val").text(testCount);

    $(".pageAccount .avgAcc .val").text(Math.round(totalAcc / testCount) + "%");
    $(".pageAccount .avgAcc10 .val").text(
      Math.round(totalAcc10 / last10) + "%"
    );

    if (totalCons == 0 || totalCons == undefined) {
      $(".pageAccount .avgCons .val").text("-");
      $(".pageAccount .avgCons10 .val").text("-");
    } else {
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

    $(".pageAccount .avgRestart .val").text(
      (testRestarts / testCount).toFixed(1)
    );

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

    let wpmPoints = filteredResults.map((r) => r.wpm).reverse();

    let trend = Misc.findLineByLeastSquares(wpmPoints);

    let wpmChange = trend[1][1] - trend[0][1];

    let wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);

    let plus = wpmChangePerHour > 0 ? "+" : "";

    $(".pageAccount .group.chart .below .text").text(
      `Speed change per hour spent typing: ${
        plus + Misc.roundTo2(wpmChangePerHour)
      } wpm.`
    );

    ChartController.accountHistory.update({ duration: 0 });
    ChartController.accountActivity.update({ duration: 0 });

    UI.swapElements(
      $(".pageAccount .preloader"),
      $(".pageAccount .content"),
      250
    );
  }
  if (DB.getSnapshot() === null) {
    Notifications.add(`Missing account data. Please refresh.`, -1);
    $(".pageAccount .preloader").html("Missing account data. Please refresh.");
  } else if (DB.getSnapshot().results === undefined) {
    DB.getUserResults().then((d) => {
      if (d) {
        ResultFilters.updateActive();
      } else {
        setTimeout(() => {
          UI.changePage("");
        }, 500);
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

$(".pageAccount .toggleAccuracyOnChart").click((e) => {
  UpdateConfig.toggleChartAccuracy();
});

$(".pageAccount .toggleChartStyle").click((e) => {
  UpdateConfig.toggleChartStyle();
});

$(".pageAccount .loadMoreButton").click((e) => {
  loadMoreLines();
});

$(document).on("click", ".pageAccount .miniResultChartButton", (event) => {
  console.log("updating");
  let filteredId = $(event.currentTarget).attr("filteredResultsId");
  if (filteredId === undefined) return;
  MiniResultChart.updateData(filteredResults[filteredId].chartData);
  MiniResultChart.show();
  MiniResultChart.updatePosition(
    event.pageX - $(".pageAccount .miniResultChartWrapper").outerWidth(),
    event.pageY + 30
  );
});
