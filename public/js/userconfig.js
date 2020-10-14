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
  // readAheadMode: false,
  caretStyle: "default",
  paceCaretStyle: "default",
  flipTestColors: false,
  capsLockBackspace: false,
  layout: "default",
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
  pageWidth: "100"
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
    // console.log('config changed before db loaded!');
    configChangedBeforeDb = true;
  }
  // showNotification('saving to cookie',1000);
  if (config.freedomMode === null) config.freedomMode = false;
  let d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  $.cookie("config", null);
  $.cookie("config", JSON.stringify(config), {
    expires: d,
    path: "/",
  });
  restartCount = 0;
  if (!noDbCheck) saveConfigToDB();
}

async function saveConfigToDB() {
  if (firebase.auth().currentUser !== null) {
    // showNotification('saving to db',1000);
    accountIconLoading(true);
    saveConfig({ uid: firebase.auth().currentUser.uid, obj: config }).then(
      (d) => {
        // console.log(d.data);
        accountIconLoading(false);
        if (d.data.returnCode === 1) {
          // showNotification('config saved to db',1000);
        } else {
          showNotification(
            `Error saving config to DB! ${d.data.message}`,
            4000
          );
        }
      }
    );
  }
}

function resetConfig() {
  config = {
    ...defaultConfig,
  };
  applyConfig();
  saveConfigToCookie();
}

function saveActiveTagsToCookie() {
  let tags = [];

  try {
    dbSnapshot.tags.forEach((tag) => {
      if (tag.active === true) {
        tags.push(tag.id);
      }
    });
    let d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    $.cookie("activeTags", null);
    $.cookie("activeTags", JSON.stringify(tags), {
      expires: d,
      path: "/",
    });
  } catch (e) {}
}

function loadConfigFromCookie() {
  let newConfig = $.cookie("config");
  if (newConfig !== undefined) {
    newConfig = JSON.parse(newConfig);
    applyConfig(newConfig);
    cookieConfig = newConfig;
    saveConfigToCookie(true);
  }
}

function applyConfig(configObj) {
  if (configObj && configObj != null && configObj != "null") {
    setTheme(configObj.theme, true);
    setCustomTheme(configObj.customTheme, true);
    setCustomThemeColors(configObj.customThemeColors, true);
    setQuickTabMode(configObj.quickTab, true);
    setNumbers(configObj.numbers, true);
    setPunctuation(configObj.punctuation, true);
    setKeyTips(configObj.showKeyTips, true);
    changeTimeConfig(configObj.time, true);
    changeQuoteLength(configObj.quoteLength, true);
    changeWordCount(configObj.words, true);
    changeMode(configObj.mode, true);
    changeLanguage(configObj.language, true);
    setCapsLockBackspace(configObj.capsLockBackspace, true);
    changeLayout(configObj.layout, true);
    changeFontSize(configObj.fontSize, true);
    setFreedomMode(configObj.freedomMode, true);
    setCaretStyle(configObj.caretStyle, true);
    setPaceCaretStyle(configObj.paceCaretStyle, true);
    setDifficulty(configObj.difficulty, true);
    setBlindMode(configObj.blindMode, true);
    setQuickEnd(configObj.quickEnd, true);
    // setReadAheadMode(configObj.readAheadMode, true);
    setFlipTestColors(configObj.flipTestColors, true);
    setColorfulMode(configObj.colorfulMode, true);
    setConfidenceMode(configObj.confidenceMode, true);
    setIndicateTypos(configObj.indicateTypos, true);
    setTimerStyle(configObj.timerStyle, true);
    setTimerColor(configObj.timerColor, true);
    setTimerOpacity(configObj.timerOpacity, true);
    changeKeymapMode(configObj.keymapMode, true);
    changeKeymapStyle(configObj.keymapStyle, true);
    changeKeymapLayout(configObj.keymapLayout, true);
    setFontFamily(configObj.fontFamily, true);
    setSmoothCaret(configObj.smoothCaret, true);
    setSmoothLineScroll(configObj.smoothLineScroll, true);
    setShowLiveWpm(configObj.showLiveWpm, true);
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

    config.startGraphsAtZero = configObj.startGraphsAtZero;
    // if (
    //   configObj.resultFilters !== null &&
    //   configObj.resultFilters !== undefined
    // ) {
    //   accountFilters = configObj.resultFilters;
    // }
    // config = configObj;
  }
  Object.keys(defaultConfig).forEach((configKey) => {
    if (config[configKey] == undefined) {
      config[configKey] = defaultConfig[configKey];
    }
  });
  updateTestModesNotice();
}

function loadActiveTagsFromCookie() {
  let newTags = $.cookie("activeTags");
  if (newTags !== undefined) {
    newTags = JSON.parse(newTags);
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
  restartTest(false,nosave);
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
  blind = !config.blindMode;
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

//read ahead mode
// function toggleReadAheadMode() {
//   config.readAheadMode = !config.readAheadMode;
//   applyReadAheadMode(config.readAheadMode);
//   updateTestModesNotice();
//   saveConfigToCookie();
// }

// function setReadAheadMode(readAhead, nosave) {
//   if (readAhead == undefined) {
//     readAhead = false;
//   }
//   config.readAheadMode = readAhead;
//   applyReadAheadMode(readAhead);
//   updateTestModesNotice();
//   if (!nosave) saveConfigToCookie();
// }

//stoponerror
// function toggleStopOnError() {
//   soe = !config.stopOnError;
//   if (soe == undefined) {
//     soe = false;
//   }
//   config.stopOnError = soe;
//   updateTestModesNotice();
//   saveConfigToCookie();
// }

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

//always show words history
function setAlwaysShowWordsHistory(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowWordsHistory = val;
  if (!nosave) saveConfigToCookie();
}

//single list command line
function setSingleListCommandLine(option, nosave) {
  if (!option) option = "manual";
  config.singleListCommandLine = option;
  if (!nosave) saveConfigToCookie();
}

//show all lines
function toggleShowAllLines() {
  sal = !config.showAllLines;
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
  qe = !config.quickEnd;
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
    $("#centerContent").addClass('wide' + val);
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
  }else if (caretStyle == "default") {
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
  }else if (caretStyle == "default") {
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
  // if (config.keymapMode !== "off") {
  //   config.keymapMode = "off";
  // }
  if (!nosave) saveConfigToCookie();
}

function toggleShowLiveWpm() {
  config.showLiveWpm = !config.showLiveWpm;
  // if (config.keymapMode !== "off") {
  //   config.keymapMode = "off";
  // }
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
  changeTimerColor(color);
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
function changeTimeConfig(time, nosave) {
  if (time !== null && !isNaN(time) && time > 0) {
  } else {
    time = 15;
  }
  time = parseInt(time);
  changeMode("time", nosave);
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
function changeQuoteLength(len, nosave) {
  if (len !== null && !isNaN(len) && len >= -1 && len <= 3) {
  } else {
    len = 1;
  }
  len = parseInt(len);
  changeMode("quote", nosave);
  config.quoteLength = len;
  $("#top .config .quoteLength .text-button").removeClass("active");
  $("#top .config .quoteLength .text-button[quoteLength='" + len + "']").addClass(
    "active"
  );
  if (!nosave) saveConfigToCookie();
}

function changeWordCount(wordCount, nosave) {
  if (wordCount !== null && !isNaN(wordCount) && wordCount > 0) {
  } else {
    wordCount = 10;
  }
  wordCount = parseInt(wordCount);
  changeMode("words", nosave);
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
}

function toggleSmoothCaret() {
  config.smoothCaret = !config.smoothCaret;
  saveConfigToCookie();
}

//startgraphsatzero
function setStartGraphsAtZero(mode, nosave) {
  config.startGraphsAtZero = mode;
  if (!nosave) saveConfigToCookie();
}

// function toggleSmoothCaret() {
//   config.smoothCaret = !config.smoothCaret;
//   saveConfigToCookie();
// }

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
    // $(".pageTest").append('<div id="restartTestButton" class="" tabindex="0"><i class="fas fa-redo-alt"></i></div>');
    $("#restartTestButton").removeClass("hidden");
    $("#restartTestButton").css("opacity", 1);
    $("#bottom .keyTips")
      .html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);
  } else {
    // $("#restartTestButton").remove();
    $("#restartTestButton").addClass("hidden");
    $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
  }
  if (!nosave) saveConfigToCookie();
}

function toggleQuickTabMode() {
  config.quickTab = !config.quickTab;
  if (!config.quickTab) {
    // $(".pageTest").append('<div id="restartTestButton" class="" tabindex="0"><i class="fas fa-redo-alt"></i></div>');
    $("#restartTestButton").removeClass("hidden");
    $("#restartTestButton").css("opacity", 1);
    $("#bottom .keyTips")
      .html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);
  } else {
    // $("#restartTestButton").remove();
    $("#restartTestButton").addClass("hidden");
    $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
  }
  saveConfigToCookie();
}

//numbers
function setNumbers(numb, nosave) {
  config.numbers = numb;
  if (!config.numbers) {
    $("#top .config .numbersMode .text-button").removeClass("active");
  } else {
    $("#top .config .numbersMode .text-button").addClass("active");
  }
  if (!nosave) saveConfigToCookie();
}

function toggleNumbers() {
  if (config.numbers) {
    $("#top .config .numbersMode .text-button").removeClass("active");
  } else {
    $("#top .config .numbersMode .text-button").addClass("active");
  }
  config.numbers = !config.numbers;
  saveConfigToCookie();
}

//punctuation
function setPunctuation(punc, nosave) {
  config.punctuation = punc;
  if (!config.punctuation) {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").addClass("active");
  }
  if (!nosave) saveConfigToCookie();
}

function togglePunctuation() {
  if (config.punctuation) {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").addClass("active");
  }
  config.punctuation = !config.punctuation;
  saveConfigToCookie();
}

//font family
function setFontFamily(font, nosave) {
  if (font == undefined) {
    font = "Roboto_Mono";
  }
  config.fontFamily = font;
  document.documentElement.style.setProperty("--font", font.replace(/_/g, " "));
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
  it = !config.indicateTypos;
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


function previewTheme(name, setIsPreviewingVar = true) {
  if (
    (testActive || resultVisible) &&
    (config.theme === "nausea" || config.theme === "round_round_baby")
  )
    return;
  if (resultVisible && (name === "nausea" || name === "round_round_baby"))
    return;
  isPreviewingTheme = setIsPreviewingVar;
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
  $(".current-theme").text(name.replace('_',' '));
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
  setTimeout(() => {
    $(".keymap-key").attr("style", "");
    refreshThemeColorObject();
    $("#metaThemeColor").attr("content", themeColors.main);
  }, 500);
  if (!nosave) saveConfigToCookie();
}

let randomTheme = null;
function randomiseTheme() {
  var randomList = themesList.map((t) => {
    return t.name;
  });
  if (config.randomTheme === "fav" && config.favThemes.length > 0)
    randomList = config.favThemes;
  randomTheme = randomList[Math.floor(Math.random() * randomList.length)];
  setTheme(randomTheme, true);
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

// function toggleRandomTheme() {
//   config.randomTheme = !config.randomTheme;
//   saveConfigToCookie();
// }

function setCustomTheme(boolean, nosave) {
  if (boolean !== undefined) config.customTheme = boolean;
  // setCustomThemeColors(config.customThemeColors, nosave);
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
  array = config.customThemeColors;

  if (config.customTheme === true) {
    $(".current-theme").text("custom");
    previewTheme("serika_dark");
    colorVars.forEach((e, index) => {
      document.documentElement.style.setProperty(e, array[index]);
    });
  } else {
    $(".current-theme").text(config.theme.replace('_',' '));
    previewTheme(config.theme);
    colorVars.forEach((e) => {
      document.documentElement.style.setProperty(e, "");
    });
  }
  setTimeout(() => {
    refreshThemeColorObject();
    updateFavicon(32, 14);
    $(".keymap-key").attr("style", "");
  }, 500);
}

function togglePresetCustomTheme() {
  if (config.customTheme) {
    setCustomTheme(false);
    applyCustomThemeColors();
    // $('[tabContent="custom"]').removeClass("reveal");
    // $('[tabContent="preset"]').addClass("reveal");
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
    // $('[tabContent="preset"]').removeClass("reveal");
    // $('[tabContent="custom"]').addClass("reveal");
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
  // document.body.appendChild(canvas);
  $("#favicon").attr("href", canvas.toDataURL("image/png"));
}

function changeLanguage(language, nosave) {
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

function changeLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.layout = layout;
  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

function changeKeymapMode(mode, nosave) {
  if (mode == null || mode == undefined) {
    mode = "off";
  }
  if (mode === "react") {
    $(".active-key").removeClass("active-key");
  }
  if (mode === "next") {
    $(".keymap-key").attr("style", "");
  }
  config.keymapMode = mode;
  restartTest(false,nosave);
  if (!nosave) saveConfigToCookie();
}

function changeKeymapStyle(style, nosave) {
  $(".keymap").removeClass("matrix");
  $(".keymap").removeClass("split");
  $(".keymap").removeClass("split_matrix");

  if (style === "matrix") {
    $(".keymap").addClass("matrix");
  } else if (style === "split") {
    $(".keymap").addClass("split");
  } else if (style === "split_matrix") {
    $(".keymap").addClass("split_matrix");
  }
  // if (style === "staggered") {
  //   $(".keymap .keymap-split-spacer").addClass("hidden");
  //   $(".keymap .r1, .r2, .r3, .r4").removeClass("matrix");
  //   $(".keymap .r5").removeClass("matrixSpace");
  //   $(".keymap #KeyLeftBracket").removeClass("hide-key");
  //   $(".keymap #KeyRightBracket").removeClass("hide-key");
  //   $(".keymap #KeyQuote").removeClass("hide-key");
  // }
  // if (style === "split") {
  //   $(".keymap .keymap-split-spacer").removeClass("hidden");
  //   $(".keymap .r1, .keymap .r2, .keymap .r3, .keymap .r4").removeClass(
  //     "matrix"
  //   );
  //   $(".keymap .r5").removeClass("splitSpace");
  //   $(".keymap #KeyLeftBracket").removeClass("hide-key");
  //   $(".keymap #KeyRightBracket").removeClass("hide-key");
  //   $(".keymap #KeyQuote").removeClass("hide-key");
  // }
  // if (style === "matrix") {
  //   $(".keymap .keymap-split-spacer").addClass("hidden");
  //   $(".keymap .r1, .keymap .r2, .keymap .r3, .keymap .r4").addClass("matrix");
  //   $(".keymap .r5").addClass("matrixSpace");
  //   $(".keymap #KeyLeftBracket").addClass("hide-key");
  //   $(".keymap #KeyRightBracket").addClass("hide-key");
  //   $(".keymap #KeyQuote").addClass("hide-key");
  // }
  config.keymapStyle = style;
  if (!nosave) saveConfigToCookie();
}

function changeKeymapLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.keymapLayout = layout;
  if (!nosave) saveConfigToCookie();
  // layouts[layout].forEach((x) => {
  //   console.log(x);
  // });

  var toReplace = layouts[layout].slice(13, 47);
  var _ = toReplace.splice(12, 1);
  var count = 0;

  $(".keymap .letter")
    .map(function () {
      if (
        !this.parentElement.classList.contains("hidden-key") &&
        !this.classList.contains("hidden-key")
      ) {
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
      }
    })
    .get();

  // console.log(all.join());
}

function changeFontSize(fontSize, nosave) {
  if (fontSize == null || fontSize == undefined) {
    fontSize = 1;
  }
  // $("#words").stop(true, true).animate({ opacity: 0 }, 125, e => {
  config.fontSize = fontSize;
  $("#words").removeClass("size125");
  $("#caret, #paceCaret").removeClass("size125");
  $("#words").removeClass("size15");
  $("#caret, #paceCaret").removeClass("size15");
  $("#words").removeClass("size2");
  $("#caret, #paceCaret").removeClass("size2");

  $("#miniTimerAndLiveWpm").removeClass("size125");
  $("#miniTimerAndLiveWpm").removeClass("size15");
  $("#miniTimerAndLiveWpm").removeClass("size2");

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
  }
  if (!nosave) saveConfigToCookie();
  // restartTest();
  // });
}
