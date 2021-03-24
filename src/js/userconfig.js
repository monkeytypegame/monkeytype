let cookieConfig = null;

let dbConfigLoaded = false;
let configChangedBeforeDb = false;

//cookies
async function saveConfigToCookie(noDbCheck = false) {
  if (!dbConfigLoaded && !noDbCheck) {
    configChangedBeforeDb = true;
  }
  // let d = new Date();
  // d.setFullYear(d.getFullYear() + 1);
  // $.cookie("config", JSON.stringify(config), {
  //   expires: d,
  //   path: "/",
  // });
  let save = Config;
  delete save.resultFilters;
  Misc.setCookie("config", JSON.stringify(save), 365);
  // restartCount = 0;
  if (!noDbCheck) await saveConfigToDB();
}

async function saveConfigToDB() {
  if (firebase.auth().currentUser !== null) {
    AccountIcon.loading(true);
    CloudFunctions.saveConfig({
      uid: firebase.auth().currentUser.uid,
      obj: Config,
    }).then((d) => {
      AccountIcon.loading(false);
      if (d.data.returnCode !== 1) {
        Notifications.add(`Error saving config to DB! ${d.data.message}`, 4000);
      }
      return;
    });
  }
}

function resetConfig() {
  ConfigSet.reset();
  applyConfig(Config);
  saveConfigToCookie();
}

function loadConfigFromCookie() {
  console.log("loading cookie config");
  // let newConfig = $.cookie("config");
  let newConfig = Misc.getCookie("config");
  if (newConfig !== undefined && newConfig !== "") {
    try {
      newConfig = JSON.parse(newConfig);
    } catch (e) {
      newConfig = {};
    }
    applyConfig(newConfig);
    console.log("applying cookie config");
    cookieConfig = newConfig;
    saveConfigToCookie(true);
    console.log("saving cookie config");
  }
  restartTest(false, true);
}

function saveActiveTagsToCookie() {
  let tags = [];

  try {
    DB.getSnapshot().tags.forEach((tag) => {
      if (tag.active === true) {
        tags.push(tag.id);
      }
    });
    // let d = new Date();
    // d.setFullYear(d.getFullYear() + 1);
    // $.cookie("activeTags", null);
    // $.cookie("activeTags", JSON.stringify(tags), {
    //   expires: d,
    //   path: "/",
    // });
    Misc.setCookie("activeTags", JSON.stringify(tags), 365);
  } catch (e) {}
}

function loadActiveTagsFromCookie() {
  // let newTags = $.cookie("activeTags");
  let newTags = Misc.getCookie("activeTags");
  if (newTags !== undefined && newTags !== "") {
    try {
      newTags = JSON.parse(newTags);
    } catch (e) {
      newTags = {};
    }
    newTags.forEach((ntag) => {
      toggleTag(ntag, true);
    });
    saveActiveTagsToCookie();
  }
}

function showTestConfig() {
  $("#top .config").removeClass("hidden").css("opacity", 1);
}

function hideTestConfig() {
  $("#top .config").css("opacity", 0).addClass("hidden");
}

function isConfigKeyValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 30) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

function setPlaySoundOnError(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  ConfigSet.playSoundOnError(val);
  if (!nosave) saveConfigToCookie();
}

function setPlaySoundOnClick(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  ConfigSet.playSoundOnClick(val);
  if (Config.playSoundOnClick !== "off") Sound.init();
  if (!nosave) saveConfigToCookie();
}

function togglePlaySoundOnError() {
  ConfigSet.playSoundOnError(!Config.playSoundOnError);
  if (Config.playSoundOnError == undefined) {
    ConfigSet.playSoundOnError(false);
  }
}

//difficulty
function setDifficulty(diff, nosave) {
  if (
    (diff !== "normal" && diff !== "expert" && diff !== "master") ||
    diff == undefined
  ) {
    diff = "normal";
  }
  ConfigSet.difficulty(diff);
  if (!nosave) restartTest(false, nosave);
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  if (!nosave) saveConfigToCookie();
}

//set fav themes
function setFavThemes(themes, nosave) {
  ConfigSet.favThemes(themes);
  if (!nosave) {
    refreshThemeButtons();
    saveConfigToCookie();
  }
}

//blind mode
function toggleBlindMode() {
  let blind = !Config.blindMode;
  if (blind == undefined) {
    blind = false;
  }
  ConfigSet.blindMode(blind);
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  saveConfigToCookie();
}

function setBlindMode(blind, nosave) {
  if (blind == undefined) {
    blind = false;
  }
  ConfigSet.blindMode(blind);
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  if (!nosave) saveConfigToCookie();
}

function updateChartAccuracy() {
  ChartController.accountHistory.data.datasets[1].hidden = !Config.chartAccuracy;
  ChartController.accountHistory.options.scales.yAxes[1].display =
    Config.chartAccuracy;
  ChartController.accountHistory.update();
}

function updateChartStyle() {
  if (Config.chartStyle == "scatter") {
    ChartController.accountHistory.data.datasets[0].showLine = false;
    ChartController.accountHistory.data.datasets[1].showLine = false;
  } else {
    ChartController.accountHistory.data.datasets[0].showLine = true;
    ChartController.accountHistory.data.datasets[1].showLine = true;
  }
  ChartController.accountHistory.update();
}

function toggleChartAccuracy() {
  if (Config.chartAccuracy) {
    ConfigSet.chartAccuracy(false);
  } else {
    ConfigSet.chartAccuracy(true);
  }
  updateChartAccuracy();
  saveConfigToCookie();
}

function setChartAccuracy(chartAccuracy, nosave) {
  if (chartAccuracy == undefined) {
    chartAccuracy = true;
  }
  ConfigSet.chartAccuracy(chartAccuracy);
  updateChartAccuracy();
  if (!nosave) saveConfigToCookie();
}

function toggleChartStyle() {
  if (Config.chartStyle == "scatter") {
    ConfigSet.chartStyle("line");
  } else {
    ConfigSet.chartStyle("scatter");
  }
  updateChartStyle();
  saveConfigToCookie();
}

function setChartStyle(chartStyle, nosave) {
  if (chartStyle == undefined) {
    chartStyle = "line";
  }
  ConfigSet.chartStyle(chartStyle);
  updateChartStyle();
  if (!nosave) saveConfigToCookie();
}

function setStopOnError(soe, nosave) {
  if (soe == undefined || soe === true || soe === false) {
    soe = "off";
  }
  ConfigSet.stopOnError(soe);
  if (Config.stopOnError !== "off") {
    ConfigSet.confidenceMode("off");
  }
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  if (!nosave) saveConfigToCookie();
}

//alwaysshowdecimal
function toggleAlwaysShowDecimalPlaces() {
  ConfigSet.alwaysShowDecimalPlaces(!Config.alwaysShowDecimalPlaces);
  saveConfigToCookie();
}

function setAlwaysShowDecimalPlaces(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  ConfigSet.alwaysShowDecimalPlaces(val);
  if (!nosave) saveConfigToCookie();
}

function toggleAlwaysShowCPM() {
  ConfigSet.alwaysShowCPM(!Config.alwaysShowCPM);
  saveConfigToCookie();
}

function setAlwaysShowCPM(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  ConfigSet.alwaysShowCPM(val);
  if (!nosave) saveConfigToCookie();
}

//show out of focus warning
function toggleShowOutOfFocusWarning() {
  ConfigSet.showOutOfFocusWarning(!Config.showOutOfFocusWarning);
  if (!Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  saveConfigToCookie();
}

function setShowOutOfFocusWarning(val, nosave) {
  if (val == undefined) {
    val = true;
  }
  ConfigSet.showOutOfFocusWarning(val);
  if (!Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  if (!nosave) saveConfigToCookie();
}

//swap esc and tab
function toggleSwapEscAndTab() {
  ConfigSet.swapEscAndTab(!Config.swapEscAndTab);
  saveConfigToCookie();
  updateKeytips();
}

function setSwapEscAndTab(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  ConfigSet.swapEscAndTab(val);
  updateKeytips();
  if (!nosave) saveConfigToCookie();
}

//pace caret
function setPaceCaret(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  // if (Config.mode === "zen" && val != "off") {
  //   Notifications.add(`Can't use pace caret with zen mode.`, 0);
  //   val = "off";
  // }
  ConfigSet.paceCaret(val);
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  initPaceCaret(nosave);
  if (!nosave) saveConfigToCookie();
}

function setPaceCaretCustomSpeed(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 100;
  }
  ConfigSet.paceCaretCustomSpeed(val);
  if (!nosave) saveConfigToCookie();
}

//min wpm
function setMinWpm(minwpm, nosave) {
  if (minwpm == undefined) {
    minwpm = "off";
  }
  ConfigSet.minWpm(minwpm);
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  if (!nosave) saveConfigToCookie();
}

function setMinWpmCustomSpeed(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 100;
  }
  ConfigSet.minWpmCustomSpeed(val);
  if (!nosave) saveConfigToCookie();
}

//min acc
function setMinAcc(min, nosave) {
  if (min == undefined) {
    min = "off";
  }
  ConfigSet.minAcc(min);
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  if (!nosave) saveConfigToCookie();
}

function setMinAccCustom(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 90;
  }
  ConfigSet.minAccCustom(val);
  if (!nosave) saveConfigToCookie();
}

//always show words history
function setAlwaysShowWordsHistory(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  ConfigSet.alwaysShowWordsHistory(val);
  if (!nosave) saveConfigToCookie();
}

function toggleAlwaysShowWordsHistory() {
  let val = !Config.alwaysShowWordsHistory;
  if (val == undefined) {
    val = false;
  }
  ConfigSet.alwaysShowWordsHistory(val);
  saveConfigToCookie();
}

//single list command line
function setSingleListCommandLine(option, nosave) {
  if (!option) option = "manual";
  ConfigSet.singleListCommandLine(option);
  if (!nosave) saveConfigToCookie();
}

//show all lines
function toggleShowAllLines() {
  let sal = !Config.showAllLines;
  if (sal == undefined) {
    sal = false;
  }
  ConfigSet.showAllLines(sal);
  restartTest();
  saveConfigToCookie();
}

function setShowAllLines(sal, nosave) {
  if (sal == undefined) {
    sal = false;
  }
  ConfigSet.showAllLines(sal);
  if (!nosave) {
    saveConfigToCookie();
    restartTest();
  }
}

//quickend
function toggleQuickEnd() {
  let qe = !Config.quickEnd;
  if (qe == undefined) {
    qe = false;
  }
  ConfigSet.quickEnd(qe);
  saveConfigToCookie();
}

function setQuickEnd(qe, nosave) {
  if (qe == undefined) {
    qe = false;
  }
  ConfigSet.quickEnd(qe);
  if (!nosave) saveConfigToCookie();
}

function setEnableAds(val, nosave) {
  if (val == undefined || val === true || val === false) {
    val = "off";
  }
  ConfigSet.enableAds(val);
  if (!nosave) saveConfigToCookie();
}

function setRepeatQuotes(val, nosave) {
  if (val == undefined || val === true || val === false) {
    val = "off";
  }
  ConfigSet.repeatQuotes(val);
  if (!nosave) saveConfigToCookie();
}

//flip colors
function setFlipTestColors(flip, nosave) {
  if (flip == undefined) {
    flip = false;
  }
  ConfigSet.flipTestColors(flip);
  TestUI.flipColors(flip);
  if (!nosave) saveConfigToCookie();
}

function toggleFlipTestColors() {
  ConfigSet.flipTestColors(!Config.flipTestColors);
  TestUI.flipColors(Config.flipTestColors);
  saveConfigToCookie();
}

//extra color
function setColorfulMode(extra, nosave) {
  if (extra == undefined) {
    extra = false;
  }
  ConfigSet.colorfulMode(extra);
  TestUI.colorful(extra);
  if (!nosave) saveConfigToCookie();
}

function toggleColorfulMode() {
  ConfigSet.colorfulMode(!Config.colorfulMode);
  TestUI.colorful(Config.colorfulMode);
  saveConfigToCookie();
}

//strict space
function setStrictSpace(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  ConfigSet.strictSpace(val);
  if (!nosave) saveConfigToCookie();
}

function toggleStrictSpace() {
  ConfigSet.strictSpace(!Config.strictSpace);
  saveConfigToCookie();
}

//opposite shift space
function setOppositeShiftMode(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  ConfigSet.oppositeShiftMode(val);
  if (!nosave) saveConfigToCookie();
}

function setPageWidth(val, nosave) {
  if (val == null || val == undefined) {
    val = "100";
  }
  ConfigSet.pageWidth(val);
  $("#centerContent").removeClass("wide125");
  $("#centerContent").removeClass("wide150");
  $("#centerContent").removeClass("wide200");
  $("#centerContent").removeClass("widemax");

  if (val !== "100") {
    $("#centerContent").addClass("wide" + val);
  }
  if (!nosave) saveConfigToCookie();
}

function setCaretStyle(caretStyle, nosave) {
  if (caretStyle == null || caretStyle == undefined) {
    caretStyle = "default";
  }
  ConfigSet.caretStyle(caretStyle);
  $("#caret").removeClass("off");
  $("#caret").removeClass("default");
  $("#caret").removeClass("underline");
  $("#caret").removeClass("outline");
  $("#caret").removeClass("block");
  $("#caret").removeClass("carrot");

  if (caretStyle == "off") {
    $("#caret").addClass("off");
  } else if (caretStyle == "default") {
    $("#caret").addClass("default");
  } else if (caretStyle == "block") {
    $("#caret").addClass("block");
  } else if (caretStyle == "outline") {
    $("#caret").addClass("outline");
  } else if (caretStyle == "underline") {
    $("#caret").addClass("underline");
  } else if (caretStyle == "carrot") {
    $("#caret").addClass("carrot");
  }
  if (!nosave) saveConfigToCookie();
}

function setPaceCaretStyle(caretStyle, nosave) {
  if (caretStyle == null || caretStyle == undefined) {
    caretStyle = "default";
  }
  ConfigSet.paceCaretStyle(caretStyle);
  $("#paceCaret").removeClass("off");
  $("#paceCaret").removeClass("default");
  $("#paceCaret").removeClass("underline");
  $("#paceCaret").removeClass("outline");
  $("#paceCaret").removeClass("block");

  if (caretStyle == "off") {
    $("#paceCaret").addClass("off");
  } else if (caretStyle == "default") {
    $("#paceCaret").addClass("default");
  } else if (caretStyle == "block") {
    $("#paceCaret").addClass("block");
  } else if (caretStyle == "outline") {
    $("#paceCaret").addClass("outline");
  } else if (caretStyle == "underline") {
    $("#paceCaret").addClass("underline");
  }
  if (!nosave) saveConfigToCookie();
}

function setShowTimerProgress(timer, nosave) {
  if (timer == null || timer == undefined) {
    timer = false;
  }
  ConfigSet.showTimerProgress(timer);
  if (Config.showTimerProgress) {
    TimerProgress.show();
  } else {
    TimerProgress.hide();
  }
  if (!nosave) saveConfigToCookie();
}

function toggleShowTimerProgress() {
  ConfigSet.showTimerProgress(!Config.showTimerProgress);
  if (Config.showTimerProgress) {
    TimerProgress.show();
  } else {
    TimerProgress.hide();
  }
  saveConfigToCookie();
}

function setShowLiveWpm(live, nosave) {
  if (live == null || live == undefined) {
    live = false;
  }
  ConfigSet.showLiveWpm(live);
  if (live) {
    LiveWpm.show();
  } else {
    LiveWpm.hide();
  }
  if (!nosave) saveConfigToCookie();
}

function toggleShowLiveWpm() {
  ConfigSet.showLiveWpm(!Config.showLiveWpm);
  if (Config.showLiveWpm) {
    LiveWpm.show();
  } else {
    LiveWpm.hide();
  }
  saveConfigToCookie();
}

function setShowLiveAcc(live, nosave) {
  if (live == null || live == undefined) {
    live = false;
  }
  ConfigSet.showLiveAcc(live);
  if (live) {
    LiveAcc.show();
  } else {
    LiveAcc.hide();
  }
  if (!nosave) saveConfigToCookie();
}

function toggleLiveAcc() {
  ConfigSet.showLiveAcc(!Config.showLiveAcc);
  if (Config.showLiveAcc) {
    LiveAcc.show();
  } else {
    LiveAcc.hide();
  }
  saveConfigToCookie();
}

function setHighlightMode(mode, nosave) {
  if (
    mode === "word" &&
    (activeFunbox === "nospace" ||
      activeFunbox === "read_ahead" ||
      activeFunbox === "read_ahead_easy" ||
      activeFunbox === "read_ahead_hard")
  ) {
    Notifications.add("Can't use word highlight with this funbox", 0);
    return;
  }
  if (mode == null || mode == undefined) {
    mode = "letter";
  }
  ConfigSet.highlightMode(mode);
  if (!nosave) saveConfigToCookie();
}

function setHideExtraLetters(val, nosave) {
  if (val == null || val == undefined) {
    val = false;
  }
  ConfigSet.hideExtraLetters(val);
  if (!nosave) saveConfigToCookie();
}

function toggleHideExtraLetters() {
  ConfigSet.hideExtraLetters(!Config.hideExtraLetters);
  saveConfigToCookie();
}

function setTimerStyle(style, nosave) {
  if (style == null || style == undefined) {
    style = "bar";
  }
  ConfigSet.timerStyle(style);
  if (!nosave) saveConfigToCookie();
}

function setTimerColor(color, nosave) {
  if (color == null || color == undefined) {
    color = "black";
  }
  ConfigSet.timerColor(color);

  $("#timer").removeClass("timerSub");
  $("#timer").removeClass("timerText");
  $("#timer").removeClass("timerMain");

  $("#timerNumber").removeClass("timerSub");
  $("#timerNumber").removeClass("timerText");
  $("#timerNumber").removeClass("timerMain");

  $("#largeLiveWpmAndAcc").removeClass("timerSub");
  $("#largeLiveWpmAndAcc").removeClass("timerText");
  $("#largeLiveWpmAndAcc").removeClass("timerMain");

  $("#miniTimerAndLiveWpm").removeClass("timerSub");
  $("#miniTimerAndLiveWpm").removeClass("timerText");
  $("#miniTimerAndLiveWpm").removeClass("timerMain");

  if (color === "main") {
    $("#timer").addClass("timerMain");
    $("#timerNumber").addClass("timerMain");
    $("#largeLiveWpmAndAcc").addClass("timerMain");
    $("#miniTimerAndLiveWpm").addClass("timerMain");
  } else if (color === "sub") {
    $("#timer").addClass("timerSub");
    $("#timerNumber").addClass("timerSub");
    $("#largeLiveWpmAndAcc").addClass("timerSub");
    $("#miniTimerAndLiveWpm").addClass("timerSub");
  } else if (color === "text") {
    $("#timer").addClass("timerText");
    $("#timerNumber").addClass("timerText");
    $("#largeLiveWpmAndAcc").addClass("timerText");
    $("#miniTimerAndLiveWpm").addClass("timerText");
  }

  if (!nosave) saveConfigToCookie();
}
function setTimerOpacity(opacity, nosave) {
  if (opacity == null || opacity == undefined) {
    opacity = 0.25;
  }
  ConfigSet.timerOpacity(opacity);
  if (!nosave) saveConfigToCookie();
}

//key tips
function setKeyTips(keyTips, nosave) {
  ConfigSet.showKeyTips(keyTips);
  if (Config.showKeyTips) {
    $("#bottom .keyTips").removeClass("hidden");
  } else {
    $("#bottom .keyTips").addClass("hidden");
  }
  if (!nosave) saveConfigToCookie();
}

function toggleKeyTips() {
  ConfigSet.showKeyTips(!Config.showKeyTips);
  if (Config.showKeyTips) {
    $("#bottom .keyTips").removeClass("hidden");
  } else {
    $("#bottom .keyTips").addClass("hidden");
  }
  saveConfigToCookie();
}

//mode
function setTimeConfig(time, nosave) {
  if (time === null || isNaN(time) || time < 0) {
    time = 15;
  }
  time = parseInt(time);
  if (!nosave) setMode("time", nosave);
  ConfigSet.time(time);
  $("#top .config .time .text-button").removeClass("active");
  if (![15, 30, 60, 120].includes(time)) {
    time = "custom";
  }
  $("#top .config .time .text-button[timeConfig='" + time + "']").addClass(
    "active"
  );
  if (!nosave) saveConfigToCookie();
}

//quote length
function setQuoteLength(len, nosave, multipleMode) {
  if (Array.isArray(len)) {
    //config load
    if (len.length === 1 && len[0] === -1) len = [1];
    ConfigSet.quoteLength(len);
  } else {
    if (!Array.isArray(Config.quoteLength)) ConfigSet.quoteLength([]);
    if (len === null || isNaN(len) || len < -2 || len > 3) {
      len = 1;
    }
    len = parseInt(len);
    if (multipleMode) {
      if (!Config.quoteLength.includes(len)) Config.quoteLength.push(len);
    } else {
      ConfigSet.quoteLength([len]);
    }
  }
  // if (!nosave) setMode("quote", nosave);
  $("#top .config .quoteLength .text-button").removeClass("active");
  Config.quoteLength.forEach((ql) => {
    $(
      "#top .config .quoteLength .text-button[quoteLength='" + ql + "']"
    ).addClass("active");
  });
  if (!nosave) saveConfigToCookie();
}

function setWordCount(wordCount, nosave) {
  if (wordCount === null || isNaN(wordCount) || wordCount < 0) {
    wordCount = 10;
  }
  wordCount = parseInt(wordCount);
  if (!nosave) setMode("words", nosave);
  ConfigSet.words(wordCount);
  $("#top .config .wordCount .text-button").removeClass("active");
  if (![10, 25, 50, 100, 200].includes(wordCount)) {
    wordCount = "custom";
  }
  $(
    "#top .config .wordCount .text-button[wordCount='" + wordCount + "']"
  ).addClass("active");
  if (!nosave) saveConfigToCookie();
}

//caret
function setSmoothCaret(mode, nosave) {
  ConfigSet.smoothCaret(mode);
  if (!nosave) saveConfigToCookie();
  if (mode) {
    $("#caret").css("animation-name", "caretFlashSmooth");
  } else {
    $("#caret").css("animation-name", "caretFlashHard");
  }
}

function toggleSmoothCaret() {
  ConfigSet.smoothCaret(!Config.smoothCaret);
  saveConfigToCookie();
  if (Config.smoothCaret) {
    $("#caret").css("animation-name", "caretFlashSmooth");
  } else {
    $("#caret").css("animation-name", "caretFlashHard");
  }
}

//startgraphsatzero
function toggleStartGraphsAtZero() {
  ConfigSet.startGraphsAtZero(!Config.startGraphsAtZero);
  saveConfigToCookie();
}

function setStartGraphsAtZero(mode, nosave) {
  ConfigSet.startGraphsAtZero(mode);
  if (!nosave) saveConfigToCookie();
}

//linescroll
function setSmoothLineScroll(mode, nosave) {
  ConfigSet.smoothLineScroll(mode);
  if (!nosave) saveConfigToCookie();
}

function toggleSmoothLineScroll() {
  ConfigSet.smoothLineScroll(!Config.smoothLineScroll);
  saveConfigToCookie();
}

//quick tab
function setQuickTabMode(mode, nosave) {
  ConfigSet.quickTab(mode);
  if (!Config.quickTab) {
    $("#restartTestButton").removeClass("hidden");
    $("#restartTestButton").css("opacity", 1);
    $("#bottom .keyTips")
      .html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);
  } else {
    $("#restartTestButton").addClass("hidden");
    $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
  }
  if (!nosave) saveConfigToCookie();
}

function toggleQuickTabMode() {
  ConfigSet.quickTab(!Config.quickTab);
  if (!Config.quickTab) {
    $("#restartTestButton").removeClass("hidden");
    $("#restartTestButton").css("opacity", 1);
    $("#bottom .keyTips")
      .html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);
  } else {
    $("#restartTestButton").addClass("hidden");
    $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
  }
  saveConfigToCookie();
}

//numbers
function setNumbers(numb, nosave) {
  if (Config.mode === "quote") {
    numb = false;
  }
  ConfigSet.numbers(numb);
  if (!Config.numbers) {
    $("#top .config .numbersMode .text-button").removeClass("active");
  } else {
    $("#top .config .numbersMode .text-button").addClass("active");
  }
  if (!nosave) saveConfigToCookie();
}

function toggleNumbers() {
  ConfigSet.numbers(!Config.numbers);
  if (Config.mode === "quote") {
    ConfigSet.numbers(false);
  }
  if (Config.numbers) {
    $("#top .config .numbersMode .text-button").addClass("active");
  } else {
    $("#top .config .numbersMode .text-button").removeClass("active");
  }
  saveConfigToCookie();
}

//punctuation
function setPunctuation(punc, nosave) {
  if (Config.mode === "quote") {
    punc = false;
  }
  ConfigSet.punctuation(punc);
  if (!Config.punctuation) {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").addClass("active");
  }
  if (!nosave) saveConfigToCookie();
}

function togglePunctuation() {
  ConfigSet.punctuation(!Config.punctuation);
  if (Config.mode === "quote") {
    ConfigSet.punctuation(false);
  }
  if (Config.punctuation) {
    $("#top .config .punctuationMode .text-button").addClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  }
  saveConfigToCookie();
}

function previewFontFamily(font) {
  if (font == undefined) {
    font = "Roboto_Mono";
  }
  document.documentElement.style.setProperty(
    "--font",
    '"' + font.replace(/_/g, " ") + '"'
  );
}

//font family
function setFontFamily(font, nosave) {
  if (font == undefined || font === "") {
    font = "Roboto_Mono";
    Notifications.add(
      "Empty input received, reverted to the default font.",
      0,
      3,
      "Custom font"
    );
  }
  if (!isConfigKeyValid(font)) {
    Notifications.add(
      `Invalid font name value: "${font}".`,
      -1,
      3,
      "Custom font"
    );
    return;
  }
  ConfigSet.fontFamily(font);
  document.documentElement.style.setProperty(
    "--font",
    '"' + font.replace(/_/g, " ") + '"'
  );
  Chart.defaults.global.defaultFontFamily = font.replace(/_/g, " ");
  if (!nosave) saveConfigToCookie();
}

//freedom
function setFreedomMode(freedom, nosave) {
  if (freedom == null) {
    freedom = false;
  }
  ConfigSet.freedomMode(freedom);
  if (Config.freedomMode && Config.confidenceMode !== "off") {
    ConfigSet.confidenceMode("off");
  }
  if (!nosave) saveConfigToCookie();
}

function toggleFreedomMode() {
  ConfigSet.freedomMode(!Config.freedomMode);
  if (Config.freedomMode && Config.confidenceMode !== "off") {
    ConfigSet.confidenceMode(false);
  }
  saveConfigToCookie();
}

function setConfidenceMode(cm, nosave) {
  if (cm == undefined) {
    cm = "off";
  }
  ConfigSet.confidenceMode(cm);
  if (Config.confidenceMode !== "off") {
    ConfigSet.freedomMode(false);
    ConfigSet.stopOnError("off");
  }

  TestUI.updateModesNotice(paceCaret, activeFunbox);
  if (!nosave) saveConfigToCookie();
}

function toggleIndicateTypos() {
  let it = !Config.indicateTypos;
  if (it == undefined) {
    it = false;
  }
  ConfigSet.indicateTypos(it);
  saveConfigToCookie();
}

function setIndicateTypos(it, nosave) {
  if (it == undefined) {
    it = false;
  }
  ConfigSet.indicateTypos(it);
  if (!nosave) saveConfigToCookie();
}

function setTheme(name, nosave) {
  ConfigSet.theme(name);
  setCustomTheme(false, true);
  ThemeController.set(Config.theme);
  if (!nosave) saveConfigToCookie();
}

function setRandomTheme(val, nosave) {
  if (val === undefined || val === true || val === false) {
    val = "off";
  }
  if (val === "off") {
    ThemeController.clearRandom();
  }
  ConfigSet.randomTheme(val);
  if (!nosave) saveConfigToCookie();
}

function setCustomTheme(boolean, nosave) {
  if (boolean !== undefined) ConfigSet.customTheme(boolean);
  if (!nosave) saveConfigToCookie();
}

function toggleCustomTheme(nosave) {
  if (Config.customTheme) {
    setCustomTheme(false);
    ThemeController.set(Config.theme);
    // applyCustomThemeColors();
    swapElements(
      $('.pageSettings [tabContent="custom"]'),
      $('.pageSettings [tabContent="preset"]'),
      250
    );
  } else {
    setCustomTheme(true);
    ThemeController.set("custom");
    // applyCustomThemeColors();
    swapElements(
      $('.pageSettings [tabContent="preset"]'),
      $('.pageSettings [tabContent="custom"]'),
      250
    );
  }
  if (!nosave) saveConfigToCookie();
}

function setCustomThemeColors(colors, nosave) {
  if (colors !== undefined) {
    ConfigSet.customThemeColors(colors);
    ThemeController.setCustomColors(colors);
    // ThemeController.set("custom");
    // applyCustomThemeColors();
  }
  if (!nosave) saveConfigToCookie();
}

function setLanguage(language, nosave) {
  if (language == null || language == undefined) {
    language = "english";
  }
  ConfigSet.language(language);
  try {
    firebase.analytics().logEvent("changedLanguage", {
      language: language,
    });
  } catch (e) {
    console.log("Analytics unavailable");
  }
  if (!nosave) saveConfigToCookie();
}

function toggleMonkey(nosave) {
  ConfigSet.monkey(!Config.monkey);
  if (Config.monkey) {
    $("#monkey").removeClass("hidden");
  } else {
    $("#monkey").addClass("hidden");
  }
  if (!nosave) saveConfigToCookie();
}

function setMonkey(monkey, nosave) {
  if (monkey === null || monkey === undefined) {
    monkey = false;
  }
  ConfigSet.monkey(monkey);
  if (Config.monkey) {
    $("#monkey").removeClass("hidden");
  } else {
    $("#monkey").addClass("hidden");
  }
  if (!nosave) saveConfigToCookie();
}

function setCapsLockBackspace(capsLockBackspace, nosave) {
  if (capsLockBackspace === null || capsLockBackspace === undefined) {
    capsLockBackspace = false;
  }
  ConfigSet.capsLockBackspace(capsLockBackspace);
  if (!nosave) saveConfigToCookie();
}

function toggleCapsLockBackspace() {
  setCapsLockBackspace(!Config.capsLockBackspace, false);
}

function setLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  ConfigSet.layout(layout);
  TestUI.updateModesNotice(paceCaret, activeFunbox);
  if (Config.keymapLayout === "overrideSync") {
    Keymap.refreshKeys(Config.keymapLayout, setKeymapLayout);
  }
  if (!nosave) saveConfigToCookie();
}

function setSavedLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  ConfigSet.savedLayout(layout);
  setLayout(layout, nosave);
}

function setKeymapMode(mode, nosave) {
  if (mode == null || mode == undefined) {
    mode = "off";
  }
  $(".active-key").removeClass("active-key");
  $(".keymap-key").attr("style", "");
  ConfigSet.keymapMode(mode);
  if (!nosave) restartTest(false, nosave);
  if (!nosave) saveConfigToCookie();
}

function setKeymapStyle(style, nosave) {
  $(".keymap").removeClass("matrix");
  $(".keymap").removeClass("split");
  $(".keymap").removeClass("split_matrix");

  if (style == null || style == undefined) {
    style = "staggered";
  }

  if (style === "matrix") {
    $(".keymap").addClass("matrix");
  } else if (style === "split") {
    $(".keymap").addClass("split");
  } else if (style === "split_matrix") {
    $(".keymap").addClass("split_matrix");
  }
  ConfigSet.keymapStyle(style);
  if (!nosave) saveConfigToCookie();
}

function setKeymapLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  ConfigSet.keymapLayout(layout);
  Keymap.refreshKeys(layout, setKeymapLayout);
  if (!nosave) saveConfigToCookie();
}

function setFontSize(fontSize, nosave) {
  if (fontSize == null || fontSize == undefined) {
    fontSize = 1;
  }
  ConfigSet.fontSize(fontSize);
  $("#words").removeClass("size125");
  $("#caret, #paceCaret").removeClass("size125");
  $("#words").removeClass("size15");
  $("#caret, #paceCaret").removeClass("size15");
  $("#words").removeClass("size2");
  $("#caret, #paceCaret").removeClass("size2");
  $("#words").removeClass("size3");
  $("#caret, #paceCaret").removeClass("size3");

  $("#miniTimerAndLiveWpm").removeClass("size125");
  $("#miniTimerAndLiveWpm").removeClass("size15");
  $("#miniTimerAndLiveWpm").removeClass("size2");
  $("#miniTimerAndLiveWpm").removeClass("size3");

  if (fontSize == 125) {
    $("#words").addClass("size125");
    $("#caret, #paceCaret").addClass("size125");
    $("#miniTimerAndLiveWpm").addClass("size125");
  } else if (fontSize == 15) {
    $("#words").addClass("size15");
    $("#caret, #paceCaret").addClass("size15");
    $("#miniTimerAndLiveWpm").addClass("size15");
  } else if (fontSize == 2) {
    $("#words").addClass("size2");
    $("#caret, #paceCaret").addClass("size2");
    $("#miniTimerAndLiveWpm").addClass("size2");
  } else if (fontSize == 3) {
    $("#words").addClass("size3");
    $("#caret, #paceCaret").addClass("size3");
    $("#miniTimerAndLiveWpm").addClass("size3");
  }
  if (!nosave) saveConfigToCookie();
}

function applyConfig(configObj) {
  if (configObj == null || configObj == undefined) {
    Notifications.add("Could not apply config", -1, 3);
    return;
  }
  Object.keys(ConfigSet.defaultConfig).forEach((configKey) => {
    if (configObj[configKey] === undefined) {
      configObj[configKey] = ConfigSet.defaultConfig[configKey];
    }
  });
  if (configObj && configObj != null && configObj != "null") {
    setTheme(configObj.theme, true);
    setCustomTheme(configObj.customTheme, true);
    setCustomThemeColors(configObj.customThemeColors, true);
    setQuickTabMode(configObj.quickTab, true);
    setKeyTips(configObj.showKeyTips, true);
    setTimeConfig(configObj.time, true);
    setQuoteLength(configObj.quoteLength, true);
    setWordCount(configObj.words, true);
    setLanguage(configObj.language, true);
    setCapsLockBackspace(configObj.capsLockBackspace, true);
    setSavedLayout(configObj.savedLayout, true);
    setFontSize(configObj.fontSize, true);
    setFreedomMode(configObj.freedomMode, true);
    setCaretStyle(configObj.caretStyle, true);
    setPaceCaretStyle(configObj.paceCaretStyle, true);
    setDifficulty(configObj.difficulty, true);
    setBlindMode(configObj.blindMode, true);
    setQuickEnd(configObj.quickEnd, true);
    setFlipTestColors(configObj.flipTestColors, true);
    setColorfulMode(configObj.colorfulMode, true);
    setConfidenceMode(configObj.confidenceMode, true);
    setIndicateTypos(configObj.indicateTypos, true);
    setTimerStyle(configObj.timerStyle, true);
    setTimerColor(configObj.timerColor, true);
    setTimerOpacity(configObj.timerOpacity, true);
    setKeymapMode(configObj.keymapMode, true);
    setKeymapStyle(configObj.keymapStyle, true);
    setKeymapLayout(configObj.keymapLayout, true);
    setFontFamily(configObj.fontFamily, true);
    setSmoothCaret(configObj.smoothCaret, true);
    setSmoothLineScroll(configObj.smoothLineScroll, true);
    setShowLiveWpm(configObj.showLiveWpm, true);
    setShowLiveAcc(configObj.showLiveAcc, true);
    setShowTimerProgress(configObj.showTimerProgress, true);
    setAlwaysShowDecimalPlaces(configObj.alwaysShowDecimalPlaces, true);
    setAlwaysShowWordsHistory(configObj.alwaysShowWordsHistory, true);
    setSingleListCommandLine(configObj.singleListCommandLine, true);
    setPlaySoundOnError(configObj.playSoundOnError, true);
    setPlaySoundOnClick(configObj.playSoundOnClick, true);
    setStopOnError(configObj.stopOnError, true);
    setFavThemes(configObj.favThemes, true);
    setRandomTheme(configObj.randomTheme, true);
    setShowAllLines(configObj.showAllLines, true);
    setSwapEscAndTab(configObj.swapEscAndTab, true);
    setShowOutOfFocusWarning(configObj.showOutOfFocusWarning, true);
    setPaceCaret(configObj.paceCaret, true);
    setPaceCaretCustomSpeed(configObj.paceCaretCustomSpeed, true);
    setPageWidth(configObj.pageWidth, true);
    setChartAccuracy(configObj.chartAccuracy, true);
    setChartStyle(configObj.chartStyle, true);
    setMinWpm(configObj.minWpm, true);
    setMinWpmCustomSpeed(configObj.minWpmCustomSpeed, true);
    setMinAcc(configObj.minAcc, true);
    setMinAccCustom(configObj.minAccCustom, true);
    setNumbers(configObj.numbers, true);
    setPunctuation(configObj.punctuation, true);
    setHighlightMode(configObj.highlightMode, true);
    setAlwaysShowCPM(configObj.alwaysShowCPM, true);
    setHideExtraLetters(configObj.hideExtraLetters, true);
    setStartGraphsAtZero(configObj.startGraphsAtZero, true);
    setStrictSpace(configObj.strictSpace, true);
    setOppositeShiftMode(configObj.oppositeShiftMode, true);
    setMode(configObj.mode, true);
    setMonkey(configObj.monkey, true);
    setRepeatQuotes(configObj.repeatQuotes, true);

    setActiveLanguageGroup();

    try {
      setEnableAds(configObj.enableAds, true);
      let addemo = false;
      if (
        firebase.app().options.projectId === "monkey-type-dev-67af4" ||
        window.location.hostname === "localhost"
      ) {
        addemo = true;
      }

      if (Config.enableAds === "max" || Config.enableAds === "on") {
        if (Config.enableAds === "max") {
          window["nitroAds"].createAd("nitropay_ad_left", {
            refreshLimit: 10,
            refreshTime: 30,
            renderVisibleOnly: false,
            refreshVisibleOnly: true,
            sizes: [["160", "600"]],
            report: {
              enabled: true,
              wording: "Report Ad",
              position: "bottom-right",
            },
            mediaQuery: "(min-width: 1330px)",
            demo: addemo,
          });
          $("#nitropay_ad_left").removeClass("hidden");

          window["nitroAds"].createAd("nitropay_ad_right", {
            refreshLimit: 10,
            refreshTime: 30,
            renderVisibleOnly: false,
            refreshVisibleOnly: true,
            sizes: [["160", "600"]],
            report: {
              enabled: true,
              wording: "Report Ad",
              position: "bottom-right",
            },
            mediaQuery: "(min-width: 1330px)",
            demo: addemo,
          });
          $("#nitropay_ad_right").removeClass("hidden");
        } else {
          $("#nitropay_ad_left").remove();
          $("#nitropay_ad_right").remove();
        }

        window["nitroAds"].createAd("nitropay_ad_footer", {
          refreshLimit: 10,
          refreshTime: 30,
          renderVisibleOnly: false,
          refreshVisibleOnly: true,
          sizes: [["970", "90"]],
          report: {
            enabled: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          mediaQuery: "(min-width: 1025px)",
          demo: addemo,
        });
        $("#nitropay_ad_footer").removeClass("hidden");

        window["nitroAds"].createAd("nitropay_ad_footer2", {
          refreshLimit: 10,
          refreshTime: 30,
          renderVisibleOnly: false,
          refreshVisibleOnly: true,
          sizes: [["728", "90"]],
          report: {
            enabled: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          mediaQuery: "(min-width: 730px) and (max-width: 1024px)",
          demo: addemo,
        });
        $("#nitropay_ad_footer2").removeClass("hidden");

        window["nitroAds"].createAd("nitropay_ad_footer3", {
          refreshLimit: 10,
          refreshTime: 30,
          renderVisibleOnly: false,
          refreshVisibleOnly: true,
          sizes: [["320", "50"]],
          report: {
            enabled: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          mediaQuery: "(max-width: 730px)",
          demo: addemo,
        });
        $("#nitropay_ad_footer3").removeClass("hidden");

        window["nitroAds"].createAd("nitropay_ad_about", {
          refreshLimit: 10,
          refreshTime: 30,
          renderVisibleOnly: false,
          refreshVisibleOnly: true,
          report: {
            enabled: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          demo: addemo,
        });
        $("#nitropay_ad_about").removeClass("hidden");

        window["nitroAds"].createAd("nitropay_ad_settings1", {
          refreshLimit: 10,
          refreshTime: 30,
          renderVisibleOnly: false,
          refreshVisibleOnly: true,
          report: {
            enabled: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          demo: addemo,
        });
        $("#nitropay_ad_settings1").removeClass("hidden");

        window["nitroAds"].createAd("nitropay_ad_settings2", {
          refreshLimit: 10,
          refreshTime: 30,
          renderVisibleOnly: false,
          refreshVisibleOnly: true,
          report: {
            enabled: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          demo: addemo,
        });
        $("#nitropay_ad_settings2").removeClass("hidden");

        window["nitroAds"].createAd("nitropay_ad_account", {
          refreshLimit: 10,
          refreshTime: 30,
          renderVisibleOnly: false,
          refreshVisibleOnly: true,
          report: {
            enabled: true,
            wording: "Report Ad",
            position: "bottom-right",
          },
          demo: addemo,
        });
        $("#nitropay_ad_account").removeClass("hidden");
      } else {
        $(".footerads").remove();
        $("#nitropay_ad_left").remove();
        $("#nitropay_ad_right").remove();
        $("#nitropay_ad_footer").remove();
        $("#nitropay_ad_footer2").remove();
        $("#nitropay_ad_footer3").remove();
        $("#nitropay_ad_settings1").remove();
        $("#nitropay_ad_settings2").remove();
        $("#nitropay_ad_account").remove();
        $("#nitropay_ad_about").remove();
      }
    } catch (e) {
      Notifications.add("Error initialising ads: " + e.message);
      console.log("error initialising ads " + e.message);
      $(".footerads").remove();
      $("#nitropay_ad_left").remove();
      $("#nitropay_ad_right").remove();
      $("#nitropay_ad_footer").remove();
      $("#nitropay_ad_footer2").remove();
      $("#nitropay_ad_footer3").remove();
      $("#nitropay_ad_settings1").remove();
      $("#nitropay_ad_settings2").remove();
      $("#nitropay_ad_account").remove();
      $("#nitropay_ad_about").remove();
    }
  }
  TestUI.updateModesNotice(paceCaret, activeFunbox);
}
