let defaultConfig = {
  theme: "serika_dark",
  customTheme: false,
  customThemeColors: [
    "#323437",
    "#e2b714",
    "#e2b714",
    "#646669",
    "#d1d0c5",
    "#ca4754",
    "#7e2a33",
    "#ca4754",
    "#7e2a33",
  ],
  favThemes: [],
  showKeyTips: true,
  showLiveWpm: false,
  showTimerProgress: true,
  smoothCaret: true,
  quickTab: false,
  punctuation: false,
  numbers: false,
  words: 50,
  time: 30,
  mode: "time",
  quoteLength: 1,
  language: "english",
  fontSize: 15,
  freedomMode: false,
  resultFilters: null,
  difficulty: "normal",
  blindMode: false,
  quickEnd: false,
  caretStyle: "default",
  paceCaretStyle: "default",
  flipTestColors: false,
  capsLockBackspace: false,
  layout: "default",
  savedLayout: "default",
  confidenceMode: "off",
  indicateTypos: false,
  timerStyle: "text",
  colorfulMode: false,
  randomTheme: "off",
  timerColor: "black",
  timerOpacity: "0.25",
  stopOnError: "off",
  showAllLines: false,
  keymapMode: "off",
  keymapStyle: "staggered",
  keymapLayout: "qwerty",
  fontFamily: "Roboto_Mono",
  smoothLineScroll: false,
  alwaysShowDecimalPlaces: false,
  alwaysShowWordsHistory: false,
  singleListCommandLine: "manual",
  playSoundOnError: false,
  playSoundOnClick: "off",
  startGraphsAtZero: true,
  swapEscAndTab: false,
  showOutOfFocusWarning: true,
  paceCaret: "off",
  paceCaretCustomSpeed: 100,
  pageWidth: "100",
  chartAccuracy: true,
  chartStyle: "line",
  minWpm: "off",
  minWpmCustomSpeed: 100,
  highlightMode: "letter",
  alwaysShowCPM: false,
  enableAds: "off",
  hideExtraLetters: false,
  strictSpace: false,
  minAcc: "off",
  minAccCustom: 90,
  showLiveAcc: false,
  monkey: false,
  repeatQuotes: "off",
};

let cookieConfig = null;

let config = {
  ...defaultConfig,
};

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
  let save = config;
  delete save.resultFilters;
  Misc.setCookie("config", JSON.stringify(save), 365);
  restartCount = 0;
  if (!noDbCheck) await saveConfigToDB();
}

async function saveConfigToDB() {
  if (firebase.auth().currentUser !== null) {
    accountIconLoading(true);
    CloudFunctions.saveConfig({
      uid: firebase.auth().currentUser.uid,
      obj: config,
    }).then((d) => {
      accountIconLoading(false);
      if (d.data.returnCode === 1) {
      } else {
        Notifications.add(`Error saving config to DB! ${d.data.message}`, 4000);
      }
      return;
    });
  }
}

function resetConfig() {
  config = {
    ...defaultConfig,
  };
  applyConfig(config);
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
    db_getSnapshot().tags.forEach((tag) => {
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

function setPlaySoundOnError(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.playSoundOnError = val;
  if (!nosave) saveConfigToCookie();
}

function setPlaySoundOnClick(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  config.playSoundOnClick = val;
  if (clickSounds === null && config.playSoundOnClick !== "off")
    initClickSounds();
  if (!nosave) saveConfigToCookie();
}

function togglePlaySoundOnError() {
  config.playSoundOnError = !config.playSoundOnError;
  if (config.playSoundOnError == undefined) {
    config.playSoundOnError = false;
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
  config.difficulty = diff;
  if (!nosave) restartTest(false, nosave);
  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

//set fav themes
function setFavThemes(themes, nosave) {
  config.favThemes = themes;
  if (!nosave) {
    refreshThemeButtons();
    saveConfigToCookie();
  }
}

//blind mode
function toggleBlindMode() {
  let blind = !config.blindMode;
  if (blind == undefined) {
    blind = false;
  }
  config.blindMode = blind;
  updateTestModesNotice();
  saveConfigToCookie();
}

function setBlindMode(blind, nosave) {
  if (blind == undefined) {
    blind = false;
  }
  config.blindMode = blind;
  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

function updateChartAccuracy() {
  resultHistoryChart.data.datasets[1].hidden = !config.chartAccuracy;
  resultHistoryChart.options.scales.yAxes[1].display = config.chartAccuracy;
  resultHistoryChart.update();
}

function updateChartStyle() {
  if (config.chartStyle == "scatter") {
    resultHistoryChart.data.datasets[0].showLine = false;
    resultHistoryChart.data.datasets[1].showLine = false;
  } else {
    resultHistoryChart.data.datasets[0].showLine = true;
    resultHistoryChart.data.datasets[1].showLine = true;
  }
  resultHistoryChart.update();
}

function toggleChartAccuracy() {
  if (config.chartAccuracy) {
    config.chartAccuracy = false;
  } else {
    config.chartAccuracy = true;
  }
  updateChartAccuracy();
  saveConfigToCookie();
}

function setChartAccuracy(chartAccuracy, nosave) {
  if (chartAccuracy == undefined) {
    chartAccuracy = true;
  }
  config.chartAccuracy = chartAccuracy;
  updateChartAccuracy();
  if (!nosave) saveConfigToCookie();
}

function toggleChartStyle() {
  if (config.chartStyle == "scatter") {
    config.chartStyle = "line";
  } else {
    config.chartStyle = "scatter";
  }
  updateChartStyle();
  saveConfigToCookie();
}

function setChartStyle(chartStyle, nosave) {
  if (chartStyle == undefined) {
    chartStyle = "line";
  }
  config.chartStyle = chartStyle;
  updateChartStyle();
  if (!nosave) saveConfigToCookie();
}

function setStopOnError(soe, nosave) {
  if (soe == undefined || soe === true || soe === false) {
    soe = "off";
  }
  config.stopOnError = soe;
  if (config.stopOnError !== "off") {
    config.confidenceMode = "off";
  }
  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

//alwaysshowdecimal
function toggleAlwaysShowDecimalPlaces() {
  config.alwaysShowDecimalPlaces = !config.alwaysShowDecimalPlaces;
  saveConfigToCookie();
}

function setAlwaysShowDecimalPlaces(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowDecimalPlaces = val;
  if (!nosave) saveConfigToCookie();
}

function toggleAlwaysShowCPM() {
  config.alwaysShowCPM = !config.alwaysShowCPM;
  saveConfigToCookie();
}

function setAlwaysShowCPM(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowCPM = val;
  if (!nosave) saveConfigToCookie();
}

//show out of focus warning
function toggleShowOutOfFocusWarning() {
  config.showOutOfFocusWarning = !config.showOutOfFocusWarning;
  if (!config.showOutOfFocusWarning) {
    $("#words").css("transition", "none").removeClass("blurred");
    $(".outOfFocusWarning").addClass("hidden");
    clearTimeouts(outOfFocusTimeouts);
  }
  saveConfigToCookie();
}

function setShowOutOfFocusWarning(val, nosave) {
  if (val == undefined) {
    val = true;
  }
  config.showOutOfFocusWarning = val;
  if (!config.showOutOfFocusWarning) {
    $("#words").css("transition", "none").removeClass("blurred");
    $(".outOfFocusWarning").addClass("hidden");
    clearTimeouts(outOfFocusTimeouts);
  }
  if (!nosave) saveConfigToCookie();
}

//swap esc and tab
function toggleSwapEscAndTab() {
  config.swapEscAndTab = !config.swapEscAndTab;
  saveConfigToCookie();
  updateKeytips();
}

function setSwapEscAndTab(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.swapEscAndTab = val;
  updateKeytips();
  if (!nosave) saveConfigToCookie();
}

//pace caret
function setPaceCaret(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  // if (config.mode === "zen" && val != "off") {
  //   Notifications.add(`Can't use pace caret with zen mode.`, 0);
  //   val = "off";
  // }
  config.paceCaret = val;
  updateTestModesNotice();
  initPaceCaret(nosave);
  if (!nosave) saveConfigToCookie();
}

function setPaceCaretCustomSpeed(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 100;
  }
  config.paceCaretCustomSpeed = val;
  if (!nosave) saveConfigToCookie();
}

//min wpm
function setMinWpm(minwpm, nosave) {
  if (minwpm == undefined) {
    minwpm = "off";
  }
  config.minWpm = minwpm;
  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

function setMinWpmCustomSpeed(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 100;
  }
  config.minWpmCustomSpeed = val;
  if (!nosave) saveConfigToCookie();
}

//min acc
function setMinAcc(min, nosave) {
  if (min == undefined) {
    min = "off";
  }
  config.minAcc = min;
  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

function setMinAccCustom(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 90;
  }
  config.minAccCustom = val;
  if (!nosave) saveConfigToCookie();
}

//always show words history
function setAlwaysShowWordsHistory(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowWordsHistory = val;
  if (!nosave) saveConfigToCookie();
}

function toggleAlwaysShowWordsHistory() {
  let val = !config.alwaysShowWordsHistory;
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowWordsHistory = val;
  saveConfigToCookie();
}

//single list command line
function setSingleListCommandLine(option, nosave) {
  if (!option) option = "manual";
  config.singleListCommandLine = option;
  if (!nosave) saveConfigToCookie();
}

//show all lines
function toggleShowAllLines() {
  let sal = !config.showAllLines;
  if (sal == undefined) {
    sal = false;
  }
  config.showAllLines = sal;
  restartTest();
  saveConfigToCookie();
}

function setShowAllLines(sal, nosave) {
  if (sal == undefined) {
    sal = false;
  }
  config.showAllLines = sal;
  if (!nosave) {
    saveConfigToCookie();
    restartTest();
  }
}

//quickend
function toggleQuickEnd() {
  let qe = !config.quickEnd;
  if (qe == undefined) {
    qe = false;
  }
  config.quickEnd = qe;
  saveConfigToCookie();
}

function setQuickEnd(qe, nosave) {
  if (qe == undefined) {
    qe = false;
  }
  config.quickEnd = qe;
  if (!nosave) saveConfigToCookie();
}

function setEnableAds(val, nosave) {
  if (val == undefined || val === true || val === false) {
    val = "off";
  }
  config.enableAds = val;
  if (!nosave) saveConfigToCookie();
}

function setRepeatQuotes(val, nosave) {
  if (val == undefined || val === true || val === false) {
    val = "off";
  }
  config.repeatQuotes = val;
  if (!nosave) saveConfigToCookie();
}

//flip colors
function setFlipTestColors(flip, nosave) {
  if (flip == undefined) {
    flip = false;
  }
  config.flipTestColors = flip;
  flipTestColors(flip);
  if (!nosave) saveConfigToCookie();
}

function toggleFlipTestColors() {
  config.flipTestColors = !config.flipTestColors;
  flipTestColors(config.flipTestColors);
  saveConfigToCookie();
}

//extra color
function setColorfulMode(extra, nosave) {
  if (extra == undefined) {
    extra = false;
  }
  config.colorfulMode = extra;
  applyColorfulMode(extra);
  if (!nosave) saveConfigToCookie();
}

function toggleColorfulMode() {
  config.colorfulMode = !config.colorfulMode;
  applyColorfulMode(config.colorfulMode);
  saveConfigToCookie();
}

//strict space
function setStrictSpace(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.strictSpace = val;
  if (!nosave) saveConfigToCookie();
}

function toggleStrictSpace() {
  config.strictSpace = !config.strictSpace;
  saveConfigToCookie();
}

function setPageWidth(val, nosave) {
  if (val == null || val == undefined) {
    val = "100";
  }
  config.pageWidth = val;
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
  config.caretStyle = caretStyle;
  $("#caret").removeClass("off");
  $("#caret").removeClass("default");
  $("#caret").removeClass("underline");
  $("#caret").removeClass("outline");
  $("#caret").removeClass("block");

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
  }
  if (!nosave) saveConfigToCookie();
}

function setPaceCaretStyle(caretStyle, nosave) {
  if (caretStyle == null || caretStyle == undefined) {
    caretStyle = "default";
  }
  config.paceCaretStyle = caretStyle;
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
  config.showTimerProgress = timer;
  if (!nosave) saveConfigToCookie();
}

function toggleShowTimerProgress() {
  config.showTimerProgress = !config.showTimerProgress;
  saveConfigToCookie();
}

function setShowLiveWpm(live, nosave) {
  if (live == null || live == undefined) {
    live = false;
  }
  config.showLiveWpm = live;
  if (!nosave) saveConfigToCookie();
}

function toggleShowLiveWpm() {
  config.showLiveWpm = !config.showLiveWpm;
  saveConfigToCookie();
}

function setShowLiveAcc(live, nosave) {
  if (live == null || live == undefined) {
    live = false;
  }
  config.showLiveAcc = live;
  if (!nosave) saveConfigToCookie();
}

function toggleShowLiveAcc() {
  config.showLiveAcc = !config.showLiveAcc;
  saveConfigToCookie();
}

function setHighlightMode(mode, nosave) {
  if (
    mode === "word" &&
    (activeFunBox === "nospace" || activeFunBox === "read_ahead")
  ) {
    Notifications.add("Can't use word highlight with this funbox", 0);
    return;
  }
  if (mode == null || mode == undefined) {
    mode = "letter";
  }
  config.highlightMode = mode;
  if (!nosave) saveConfigToCookie();
}

function setHideExtraLetters(val, nosave) {
  if (val == null || val == undefined) {
    val = false;
  }
  config.hideExtraLetters = val;
  if (!nosave) saveConfigToCookie();
}

function toggleHideExtraLetters() {
  config.hideExtraLetters = !config.hideExtraLetters;
  saveConfigToCookie();
}

function setTimerStyle(style, nosave) {
  if (style == null || style == undefined) {
    style = "bar";
  }
  config.timerStyle = style;
  if (!nosave) saveConfigToCookie();
}

function setTimerColor(color, nosave) {
  if (color == null || color == undefined) {
    color = "black";
  }
  config.timerColor = color;

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
  config.timerOpacity = opacity;
  if (!nosave) saveConfigToCookie();
}

//key tips
function setKeyTips(keyTips, nosave) {
  config.showKeyTips = keyTips;
  if (config.showKeyTips) {
    $("#bottom .keyTips").removeClass("hidden");
  } else {
    $("#bottom .keyTips").addClass("hidden");
  }
  if (!nosave) saveConfigToCookie();
}

function toggleKeyTips() {
  config.showKeyTips = !config.showKeyTips;
  if (config.showKeyTips) {
    $("#bottom .keyTips").removeClass("hidden");
  } else {
    $("#bottom .keyTips").addClass("hidden");
  }
  saveConfigToCookie();
}

//mode
function setTimeConfig(time, nosave) {
  if (time !== null && !isNaN(time) && time >= 0) {
  } else {
    time = 15;
  }
  time = parseInt(time);
  if (!nosave) setMode("time", nosave);
  config.time = time;
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
function setQuoteLength(len, nosave) {
  if (len !== null && !isNaN(len) && len >= -1 && len <= 3) {
  } else {
    len = 1;
  }
  len = parseInt(len);
  if (!nosave) setMode("quote", nosave);
  config.quoteLength = len;
  $("#top .config .quoteLength .text-button").removeClass("active");
  $(
    "#top .config .quoteLength .text-button[quoteLength='" + len + "']"
  ).addClass("active");
  if (!nosave) saveConfigToCookie();
}

function setWordCount(wordCount, nosave) {
  if (wordCount !== null && !isNaN(wordCount) && wordCount >= 0) {
  } else {
    wordCount = 10;
  }
  wordCount = parseInt(wordCount);
  if (!nosave) setMode("words", nosave);
  config.words = wordCount;
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
  config.smoothCaret = mode;
  if (!nosave) saveConfigToCookie();
  if (mode) {
    $("#caret").css("animation-name", "caretFlashSmooth");
  } else {
    $("#caret").css("animation-name", "caretFlashHard");
  }
}

function toggleSmoothCaret() {
  config.smoothCaret = !config.smoothCaret;
  saveConfigToCookie();
  if (config.smoothCaret) {
    $("#caret").css("animation-name", "caretFlashSmooth");
  } else {
    $("#caret").css("animation-name", "caretFlashHard");
  }
}

//startgraphsatzero
function toggleStartGraphsAtZero() {
  config.startGraphsAtZero = !config.startGraphsAtZero;
  saveConfigToCookie();
}

function setStartGraphsAtZero(mode, nosave) {
  config.startGraphsAtZero = mode;
  if (!nosave) saveConfigToCookie();
}

//linescroll
function setSmoothLineScroll(mode, nosave) {
  config.smoothLineScroll = mode;
  if (!nosave) saveConfigToCookie();
}

function toggleSmoothLineScroll() {
  config.smoothLineScroll = !config.smoothLineScroll;
  saveConfigToCookie();
}

//quick tab
function setQuickTabMode(mode, nosave) {
  config.quickTab = mode;
  if (!config.quickTab) {
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
  config.quickTab = !config.quickTab;
  if (!config.quickTab) {
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
  if (config.mode === "quote") {
    numb = false;
  }
  config.numbers = numb;
  if (!config.numbers) {
    $("#top .config .numbersMode .text-button").removeClass("active");
  } else {
    $("#top .config .numbersMode .text-button").addClass("active");
  }
  if (!nosave) saveConfigToCookie();
}

function toggleNumbers() {
  config.numbers = !config.numbers;
  if (config.mode === "quote") {
    config.numbers = false;
  }
  if (config.numbers) {
    $("#top .config .numbersMode .text-button").addClass("active");
  } else {
    $("#top .config .numbersMode .text-button").removeClass("active");
  }
  saveConfigToCookie();
}

//punctuation
function setPunctuation(punc, nosave) {
  if (config.mode === "quote") {
    punc = false;
  }
  config.punctuation = punc;
  if (!config.punctuation) {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").addClass("active");
  }
  if (!nosave) saveConfigToCookie();
}

function togglePunctuation() {
  config.punctuation = !config.punctuation;
  if (config.mode === "quote") {
    config.punctuation = false;
  }
  if (config.punctuation) {
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
  document.documentElement.style.setProperty("--font", font.replace(/_/g, " "));
}

//font family
function setFontFamily(font, nosave) {
  if (font == undefined || font === "") {
    font = "Roboto_Mono";
  }
  config.fontFamily = font;
  document.documentElement.style.setProperty("--font", font.replace(/_/g, " "));
  Chart.defaults.global.defaultFontFamily = font.replace(/_/g, " ");
  if (!nosave) saveConfigToCookie();
}

//freedom
function setFreedomMode(freedom, nosave) {
  if (freedom == null) {
    freedom = false;
  }
  config.freedomMode = freedom;
  if (config.freedomMode && config.confidenceMode !== "off") {
    config.confidenceMode = "off";
  }
  if (!nosave) saveConfigToCookie();
}

function toggleFreedomMode() {
  config.freedomMode = !config.freedomMode;
  if (config.freedomMode && config.confidenceMode !== "off") {
    config.confidenceMode = false;
  }
  saveConfigToCookie();
}

function setConfidenceMode(cm, nosave) {
  if (cm == undefined) {
    cm = "off";
  }
  config.confidenceMode = cm;
  if (config.confidenceMode !== "off") {
    config.freedomMode = false;
    config.stopOnError = "off";
  }

  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

function toggleIndicateTypos() {
  let it = !config.indicateTypos;
  if (it == undefined) {
    it = false;
  }
  config.indicateTypos = it;
  saveConfigToCookie();
}

function setIndicateTypos(it, nosave) {
  if (it == undefined) {
    it = false;
  }
  config.indicateTypos = it;
  if (!nosave) saveConfigToCookie();
}

function updateChartColors() {
  hoverChart.options.scales.xAxes[0].ticks.minor.fontColor = themeColors.sub;
  hoverChart.options.scales.xAxes[0].scaleLabel.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[0].ticks.minor.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[2].ticks.minor.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[0].scaleLabel.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[2].scaleLabel.fontColor = themeColors.sub;

  hoverChart.data.datasets[0].borderColor = themeColors.main;
  hoverChart.data.datasets[0].pointBackgroundColor = themeColors.main;
  hoverChart.data.datasets[1].borderColor = themeColors.sub;
  hoverChart.data.datasets[1].pointBackgroundColor = themeColors.sub;

  hoverChart.options.annotation.annotations[0].borderColor = themeColors.sub;
  hoverChart.options.annotation.annotations[0].label.backgroundColor =
    themeColors.sub;
  hoverChart.options.annotation.annotations[0].label.fontColor = themeColors.bg;

  activityChart.options.legend.labels.fontColor = themeColors.sub;

  activityChart.options.scales.xAxes[0].ticks.minor.fontColor = themeColors.sub;
  activityChart.options.scales.yAxes[0].ticks.minor.fontColor = themeColors.sub;
  activityChart.options.scales.yAxes[0].scaleLabel.fontColor = themeColors.sub;
  activityChart.data.datasets[0].borderColor = themeColors.main;
  activityChart.data.datasets[0].backgroundColor = themeColors.main;

  activityChart.data.datasets[0].trendlineLinear.style = themeColors.sub;

  activityChart.options.scales.yAxes[1].ticks.minor.fontColor = themeColors.sub;
  activityChart.options.scales.yAxes[1].scaleLabel.fontColor = themeColors.sub;
  activityChart.data.datasets[1].borderColor = themeColors.sub;

  activityChart.options.legend.labels.fontColor = themeColors.sub;

  resultHistoryChart.options.scales.xAxes[0].ticks.minor.fontColor =
    themeColors.sub;
  resultHistoryChart.options.scales.yAxes[0].ticks.minor.fontColor =
    themeColors.sub;
  resultHistoryChart.options.scales.yAxes[0].scaleLabel.fontColor =
    themeColors.sub;
  resultHistoryChart.options.scales.yAxes[1].ticks.minor.fontColor =
    themeColors.sub;
  resultHistoryChart.options.scales.yAxes[1].scaleLabel.fontColor =
    themeColors.sub;
  resultHistoryChart.data.datasets[0].borderColor = themeColors.main;
  resultHistoryChart.data.datasets[1].borderColor = themeColors.sub;

  resultHistoryChart.options.legend.labels.fontColor = themeColors.sub;
  resultHistoryChart.data.datasets[0].trendlineLinear.style = themeColors.sub;
  wpmOverTimeChart.data.datasets[0].borderColor = themeColors.main;
  wpmOverTimeChart.data.datasets[0].pointBackgroundColor = themeColors.main;
  wpmOverTimeChart.data.datasets[1].borderColor = themeColors.sub;
  wpmOverTimeChart.data.datasets[1].pointBackgroundColor = themeColors.sub;

  hoverChart.update();
  wpmOverTimeChart.update();
  resultHistoryChart.update();
  activityChart.update();
}

function previewTheme(name, setIsPreviewingVar = true) {
  if (
    (testActive || resultVisible) &&
    (config.theme === "nausea" || config.theme === "round_round_baby")
  )
    return;
  if (resultVisible && (name === "nausea" || name === "round_round_baby"))
    return;
  isPreviewingTheme = setIsPreviewingVar;
  clearCustomTheme();
  $("#currentTheme").attr("href", `themes/${name}.css`);
  setTimeout(() => {
    refreshThemeColorObject();
  }, 500);
}

function setTheme(name, nosave) {
  if (
    (testActive || resultVisible) &&
    (config.theme === "nausea" || config.theme === "round_round_baby")
  ) {
    return;
  }
  if (resultVisible && (name === "nausea" || name === "round_round_baby"))
    return;
  config.theme = name;
  $(".keymap-key").attr("style", "");
  $("#currentTheme").attr("href", `themes/${name}.css`);
  $(".current-theme").text(name.replace("_", " "));
  setTimeout(() => {
    updateFavicon(32, 14);
  }, 500);
  try {
    firebase.analytics().logEvent("changedTheme", {
      theme: name,
    });
  } catch (e) {
    console.log("Analytics unavailable");
  }
  setCustomTheme(false, true);
  clearCustomTheme();
  // applyCustomThemeColors();
  setTimeout(() => {
    $(".keymap-key").attr("style", "");
    refreshThemeColorObject();
    $("#metaThemeColor").attr("content", themeColors.main);
  }, 500);
  if (!nosave) saveConfigToCookie();
}

let randomTheme = null;
function randomiseTheme() {
  // var randomList = Misc.getThemesList().map((t) => {
  //   return t.name;
  // });
  var randomList;
  Misc.getThemesList().then((themes) => {
    randomList = themes.map((t) => {
      return t.name;
    });

    if (config.randomTheme === "fav" && config.favThemes.length > 0)
      randomList = config.favThemes;
    randomTheme = randomList[Math.floor(Math.random() * randomList.length)];
    setTheme(randomTheme, true);
    Notifications.add(randomTheme.replace(/_/g, " "), 0);
  });
}

function setRandomTheme(val, nosave) {
  if (val === undefined || val === true || val === false) {
    val = "off";
  }
  if (val === "off") {
    randomTheme = null;
  }
  config.randomTheme = val;
  if (!nosave) saveConfigToCookie();
}

function setCustomTheme(boolean, nosave) {
  if (boolean !== undefined) config.customTheme = boolean;
  if (!nosave) saveConfigToCookie();
}

function setCustomThemeColors(colors, nosave) {
  if (colors !== undefined) {
    config.customThemeColors = colors;
    applyCustomThemeColors();
  }
  if (!nosave) saveConfigToCookie();
}

function applyCustomThemeColors() {
  const array = config.customThemeColors;

  if (config.customTheme === true) {
    $(".current-theme").text("custom");
    previewTheme("serika_dark", false);
    colorVars.forEach((e, index) => {
      document.documentElement.style.setProperty(e, array[index]);
    });
  } else {
    $(".current-theme").text(config.theme.replace("_", " "));
    previewTheme(config.theme, false);
    clearCustomTheme();
  }
  setTimeout(() => {
    refreshThemeColorObject();
    updateFavicon(32, 14);
    $(".keymap-key").attr("style", "");
  }, 500);
}

function clearCustomTheme() {
  colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });
}

function togglePresetCustomTheme() {
  if (config.customTheme) {
    setCustomTheme(false);
    applyCustomThemeColors();
    swapElements(
      $('.pageSettings [tabContent="custom"]'),
      $('.pageSettings [tabContent="preset"]'),
      250
    );
  } else {
    setCustomTheme(true);
    applyCustomThemeColors();
    swapElements(
      $('.pageSettings [tabContent="preset"]'),
      $('.pageSettings [tabContent="custom"]'),
      250
    );
  }
  $(".keymap-key").attr("style", "");
}

function updateFavicon(size, curveSize) {
  let maincolor, bgcolor;

  bgcolor = getComputedStyle(document.body)
    .getPropertyValue("--bg-color")
    .replace(" ", "");
  maincolor = getComputedStyle(document.body)
    .getPropertyValue("--main-color")
    .replace(" ", "");

  if (bgcolor == maincolor) {
    bgcolor = "#111";
    maincolor = "#eee";
  }

  var canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  let ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(0, curveSize);
  //top left
  ctx.quadraticCurveTo(0, 0, curveSize, 0);
  ctx.lineTo(size - curveSize, 0);
  //top right
  ctx.quadraticCurveTo(size, 0, size, curveSize);
  ctx.lineTo(size, size - curveSize);
  ctx.quadraticCurveTo(size, size, size - curveSize, size);
  ctx.lineTo(curveSize, size);
  ctx.quadraticCurveTo(0, size, 0, size - curveSize);
  ctx.fillStyle = bgcolor;
  ctx.fill();
  ctx.font = "900 " + (size / 2) * 1.2 + "px Roboto Mono";
  ctx.textAlign = "center";
  ctx.fillStyle = maincolor;
  ctx.fillText("mt", size / 2 + size / 32, (size / 3) * 2.1);
  $("#favicon").attr("href", canvas.toDataURL("image/png"));
}

function setLanguage(language, nosave) {
  if (language == null || language == undefined) {
    language = "english";
  }
  config.language = language;
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
  config.monkey = !config.monkey;
  if (config.monkey) {
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
  config.monkey = monkey;
  if (config.monkey) {
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
  config.capsLockBackspace = capsLockBackspace;
  if (!nosave) saveConfigToCookie();
}

function toggleCapsLockBackspace() {
  setCapsLockBackspace(!config.capsLockBackspace, false);
}

function setLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.layout = layout;
  updateTestModesNotice();
  if (config.keymapLayout === "overrideSync") {
    refreshKeymapKeys(config.keymapLayout);
  }
  if (!nosave) saveConfigToCookie();
}

function setSavedLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.savedLayout = layout;
  setLayout(layout, nosave);
}

function setKeymapMode(mode, nosave) {
  if (mode == null || mode == undefined) {
    mode = "off";
  }
  $(".active-key").removeClass("active-key");
  $(".keymap-key").attr("style", "");
  config.keymapMode = mode;
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
  config.keymapStyle = style;
  if (!nosave) saveConfigToCookie();
}

function keymapShowIsoKey(tf) {
  if (tf) {
    $(".keymap .r4 .keymap-key.first").removeClass("hidden-key");
  } else {
    $(".keymap .r4 .keymap-key.first").addClass("hidden-key");
  }
}

function setKeymapLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.keymapLayout = layout;
  refreshKeymapKeys(layout);
  if (!nosave) saveConfigToCookie();
}

function refreshKeymapKeys(layout) {
  try {
    let lts = layouts[layout]; //layout to show
    let layoutString = layout;
    if (config.keymapLayout === "overrideSync") {
      if (config.layout === "default") {
        lts = layouts["qwerty"];
        layoutString = "default";
      } else {
        lts = layouts[config.layout];
        layoutString = config.layout;
      }
    }

    if (lts.keymapShowTopRow) {
      $(".keymap .r1").removeClass("hidden");
    } else {
      $(".keymap .r1").addClass("hidden");
    }

    $($(".keymap .r5 .keymap-key .letter")[0]).text(
      layoutString.replace(/_/g, " ")
    );
    keymapShowIsoKey(lts.iso);

    var toReplace = lts.keys.slice(1, 48);
    var count = 0;

    $(".keymap .letter")
      .map(function () {
        if (count < toReplace.length) {
          var key = toReplace[count].charAt(0);
          this.innerHTML = key;

          switch (key) {
            case "\\":
            case "|":
              this.parentElement.id = "KeyBackslash";
              break;
            case "}":
            case "]":
              this.parentElement.id = "KeyRightBracket";
              break;
            case "{":
            case "[":
              this.parentElement.id = "KeyLeftBracket";
              break;
            case '"':
            case "'":
              this.parentElement.id = "KeyQuote";
              break;
            case ":":
            case ";":
              this.parentElement.id = "KeySemicolon";
              break;
            case "<":
            case ",":
              this.parentElement.id = "KeyComma";
              break;
            case ">":
            case ".":
              this.parentElement.id = "KeyPeriod";
              break;
            case "?":
            case "/":
              this.parentElement.id = "KeySlash";
              break;
            case "":
              this.parentElement.id = "KeySpace";
              break;
            default:
              this.parentElement.id = `Key${key.toUpperCase()}`;
          }
        }
        count++;
        // }
      })
      .get();
  } catch (e) {
    console.log(
      "something went wrong when changing layout, resettings: " + e.message
    );
    setKeymapLayout("qwerty", true);
  }
}

function setFontSize(fontSize, nosave) {
  if (fontSize == null || fontSize == undefined) {
    fontSize = 1;
  }
  config.fontSize = fontSize;
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
  Object.keys(defaultConfig).forEach((configKey) => {
    if (configObj[configKey] === undefined) {
      configObj[configKey] = defaultConfig[configKey];
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
    setMode(configObj.mode, true);
    setMonkey(configObj.monkey, true);

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

      if (config.enableAds === "max" || config.enableAds === "on") {
        if (config.enableAds === "max") {
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
  updateTestModesNotice();
}
