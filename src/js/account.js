import * as DB from "./db";
import * as Misc from "./misc";
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
import * as AccountController from "./account-controller";
import axiosInstance from "./axios-instance";

let filterDebug = false;
//toggle filterdebug
export function toggleFilterDebug() {
  filterDebug = !filterDebug;
  if (filterDebug) {
    console.log("filterDebug is on");
  }
}

export async function getDataAndInit() {
  try {
    console.log("getting account data");
    await DB.initSnapshot();
  } catch (e) {
    AccountButton.loading(false);
    if (e?.response?.status === 429) {
      Notifications.add(
        "Doing so will save you bandwidth, make the next test be ready faster and will not sign you out (which could mean your new personal best would not save to your account).",
        0,
        0
      );
      Notifications.add(
        "You will run into this error if you refresh the website to restart the test. It is NOT recommended to do that. Instead, use tab + enter or just tab (with quick tab mode enalbed) to restart the test.",
        0,
        0
      );
    }
    let msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to get user data: " + msg, -1);

    // $("#top #menu .account .icon").html('<i class="fas fa-fw fa-times"></i>');
    $("#top #menu .account").css("opacity", 1);
    if ($(".pageLoading").hasClass("active")) UI.changePage("");
    AccountController.signOut();
    return;
  }
  let snap = DB.getSnapshot();
  $("#menu .icon-button.account .text").text(snap.name);
  // if (snap === null) {
  //   throw "Missing db snapshot. Client likely could not connect to the backend.";
  // }
  let user = firebase.auth().currentUser;
  if (snap.name == undefined) {
    //verify username
    if (Misc.isUsernameValid(user.name)) {
      //valid, just update
      snap.name = user.name;
      DB.setSnapshot(snap);
      DB.updateName(user.uid, user.name);
    } else {
      //invalid, get new
      // Notifications.add("Invalid name", 0);
      // let promptVal = null;
      // let cdnVal = undefined;

      // while (
      //   promptVal === null ||
      //   cdnVal === undefined ||
      //   cdnVal.data.status < 0
      // ) {
      //   promptVal = prompt(
      //     "Your name is either invalid or unavailable (you also need to do this if you used Google Sign Up). Please provide a new display name (cannot be longer than 14 characters, can only contain letters, numbers, underscores, dots and dashes):"
      //   );
      //   //TODO update
      //   axiosInstance
      //     .post("/updateName", {
      //       name: promptVal,
      //     })
      //     .then((cdnVal) => {
      //       if (cdnVal.data.status === 1) {
      //         alert("Name updated", 1);
      //         location.reload();
      //       } else if (cdnVal.data.status < 0) {
      //         alert(cdnVal.data.message, 0);
      //       }
      //     });
      // }
      let nameGood = false;
      let name = "";

      while (nameGood === false) {
        name = await prompt(
          "Please provide a new username (cannot be longer than 16 characters, can only contain letters, numbers, underscores, dots and dashes):"
        );

        if (name == null) {
          AccountController.signOut();
          return;
        }

        let response;
        try {
          response = await axiosInstance.post("/user/updateName", { name });
        } catch (e) {
          let msg = e?.response?.data?.message ?? e.message;
          if (e.response.status >= 500) {
            Notifications.add("Failed to update name: " + msg, -1);
            throw e;
          } else {
            alert(msg);
          }
        }
        if (response?.status == 200) {
          nameGood = true;
          Notifications.add("Name updated", 1);
          DB.getSnapshot().name = name;
          $("#menu .icon-button.account .text").text(name);
        }
      }
    }
  }
  // if($(".pageAccount").hasClass('active')) update();
  // if ($(".pageLogin").hasClass("active")) UI.changePage("account");
  if (!UpdateConfig.changedBeforeDb) {
    //config didnt change before db loaded
    if (Config.localStorageConfig === null) {
      console.log("no local config, applying db");
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
        console.log("configs are different, applying config from db");
        AccountButton.loading(false);
        UpdateConfig.apply(DB.getSnapshot().config);
        Settings.update();
        UpdateConfig.saveToLocalStorage(true);
        if ($(".page.pageTest").hasClass("active")) {
          TestLogic.restart(false, true);
        }
        DB.saveConfig(Config);
      }
    }
    UpdateConfig.setDbConfigLoaded(true);
  } else {
    console.log("config changed before db");
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
  UI.setPageTransition(false);
  console.log("account loading finished");
  if ($(".pageLoading").hasClass("active")) UI.changePage("");
}

let filteredResults = [];
let visibleTableLines = 0;

function loadMoreLines(lineIndex) {
  if (filteredResults == [] || filteredResults.length == 0) return;
  let newVisibleLines;
  if (lineIndex && lineIndex > visibleTableLines) {
    newVisibleLines = Math.ceil(lineIndex / 10) * 10;
  } else {
    newVisibleLines = visibleTableLines + 10;
  }
  for (let i = visibleTableLines; i < newVisibleLines; i++) {
    const result = filteredResults[i];
    if (result == undefined) continue;
    let withpunc = "";
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
        DB.getSnapshot().tags.forEach((snaptag) => {
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
    <td>${result.mode} ${result.mode2}${withpunc}</td>
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

let totalSecondsFiltered = 0;

export function update() {
  function cont() {
    console.log("updating account page");
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

    // let totalSeconds = 0;
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
          if ([15, 30, 60, 120].includes(parseInt(result.mode2))) {
            timefilter = result.mode2;
          }
          if (!ResultFilters.getFilter("time", timefilter)) {
            if (filterDebug)
              console.log(`skipping result due to time filter`, result);
            return;
          }
        } else if (result.mode == "words") {
          let wordfilter = "custom";
          if ([10, 25, 50, 100, 200].includes(parseInt(result.mode2))) {
            wordfilter = result.mode2;
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
          let validTags = DB.getSnapshot().tags.map((t) => t._id);
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

        let timeSinceTest = Math.abs(result.timestamp - Date.now()) / 1000;

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
          result.testDuration +
          result.incompleteTestSeconds -
          (result.afkDuration ?? 0);
        activityChartData[resultDate].totalWpm += result.wpm;
      } else {
        activityChartData[resultDate] = {
          amount: 1,
          time:
            result.testDuration +
            result.incompleteTestSeconds -
            (result.afkDuration ?? 0),
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

      tt += (result.incompleteTestSeconds ?? 0) - (result.afkDuration ?? 0);

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
        y: Config.alwaysShowCPM ? Misc.roundTo2(result.wpm * 5) : result.wpm,
        acc: result.acc,
        mode: result.mode,
        mode2: result.mode2,
        punctuation: result.punctuation,
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
        let puncsctring = result.punctuation ? ",<br>with punctuation" : "";
        let numbsctring = result.numbers
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
          (Config.alwaysShowCPM
            ? activityChartData[date].totalWpm * 5
            : activityChartData[date].totalWpm) / activityChartData[date].amount
        ),
      });
      lastTimestamp = date;
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
    console.log("Test count: " + testCount);
    console.log("Test restarts: " + testRestarts);
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

    let wpmPoints = filteredResults.map((r) => r.wpm).reverse();

    let trend = Misc.findLineByLeastSquares(wpmPoints);

    let wpmChange = trend[1][1] - trend[0][1];

    let wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);

    let plus = wpmChangePerHour > 0 ? "+" : "";

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

function sortAndRefreshHistory(key, headerClass, forceDescending = null) {
  // Removes styling from previous sorting requests:
  $("td").removeClass("header-sorted");
  $("td").children("i").remove();
  $(headerClass).addClass("header-sorted");

  if (filteredResults.length < 2) return;

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
    filteredResults[0][key] <= filteredResults[filteredResults.length - 1][key]
  ) {
    descending = true;
    $(headerClass).append(
      '<i class="fas fa-sort-down" aria-hidden="true"></i>'
    );
  } else {
    descending = false;
    $(headerClass).append('<i class="fas fa-sort-up", aria-hidden="true"></i>');
  }

  let temp = [];
  let parsedIndexes = [];

  while (temp.length < filteredResults.length) {
    let lowest = Number.MAX_VALUE;
    let highest = -1;
    let idx = -1;

    for (let i = 0; i < filteredResults.length; i++) {
      //find the lowest wpm with index not already parsed
      if (!descending) {
        if (filteredResults[i][key] <= lowest && !parsedIndexes.includes(i)) {
          lowest = filteredResults[i][key];
          idx = i;
        }
      } else {
        if (filteredResults[i][key] >= highest && !parsedIndexes.includes(i)) {
          highest = filteredResults[i][key];
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

$(".pageAccount .toggleAccuracyOnChart").click((e) => {
  UpdateConfig.toggleChartAccuracy();
});

$(".pageAccount .toggleChartStyle").click((e) => {
  UpdateConfig.toggleChartStyle();
});

$(".pageAccount .loadMoreButton").click((e) => {
  loadMoreLines();
});

let activeChartIndex;

export function setActiveChartIndex(index) {
  activeChartIndex = index;
}

$(".pageAccount #accountHistoryChart").click((e) => {
  let index = activeChartIndex;
  loadMoreLines(index);
  $([document.documentElement, document.body]).animate(
    {
      scrollTop: $(`#result-${index}`).offset().top - $(window).height() / 2,
    },
    500
  );
  $(".resultRow").removeClass("active");
  $(`#result-${index}`).addClass("active");
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

$(document).on("click", ".history-wpm-header", (event) => {
  sortAndRefreshHistory("wpm", ".history-wpm-header");
});

$(document).on("click", ".history-raw-header", (event) => {
  sortAndRefreshHistory("rawWpm", ".history-raw-header");
});

$(document).on("click", ".history-acc-header", (event) => {
  sortAndRefreshHistory("acc", ".history-acc-header");
});

$(document).on("click", ".history-correct-chars-header", (event) => {
  sortAndRefreshHistory("correctChars", ".history-correct-chars-header");
});

$(document).on("click", ".history-incorrect-chars-header", (event) => {
  sortAndRefreshHistory("incorrectChars", ".history-incorrect-chars-header");
});

$(document).on("click", ".history-consistency-header", (event) => {
  sortAndRefreshHistory("consistency", ".history-consistency-header");
});

$(document).on("click", ".history-date-header", (event) => {
  sortAndRefreshHistory("timestamp", ".history-date-header");
});

// Resets sorting to by date' when applying filers (normal or advanced)
$(document).on("click", ".buttonsAndTitle .buttons .button", (event) => {
  // We want to 'force' descending sort:
  sortAndRefreshHistory("timestamp", ".history-date-header", true);
});
