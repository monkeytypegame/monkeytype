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
  showKeyTips: true,
  showLiveWpm: false,
  showTimerBar: true,
  smoothCaret: true,
  quickTab: false,
  punctuation: false,
  words: 50,
  time: 60,
  mode: "time",
  language: "english",
  fontSize: 1,
  freedomMode: false,
  resultFilters: ["all"],
  difficulty: "normal",
  blindMode: false,
  quickEnd: false,
  caretStyle: "default",
  flipTestColors: false,
  layout: "default",
  showDiscordDot: true,
  maxConfidence: false,
  timerStyle: "bar",
  colorfulMode: true,
  randomTheme: true,
};

let cookieConfig = null;

let config = defaultConfig;

//cookies
function saveConfigToCookie() {
  // showNotification('saving to cookie',1000);
  let d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  $.cookie("config", null);
  $.cookie("config", JSON.stringify(config), {
    expires: d,
    path: "/",
  });
  restartCount = 0;
  saveConfigToDB();
}

function saveConfigToDB() {
  if (firebase.auth().currentUser !== null) {
    // showNotification('saving to db',1000);
    accountIconLoading(true);
    saveConfig({ uid: firebase.auth().currentUser.uid, obj: config }).then(
      (d) => {
        accountIconLoading(false);
        if (d.data === 1) {
          // showNotification('config saved to db',1000);
        } else {
          showNotification("Error saving config to DB!", 4000);
        }
      }
    );
  }
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
    saveConfigToCookie();
  }
}

function applyConfig(configObj) {
  if (configObj && configObj != null && configObj != "null") {
    setTheme(configObj.theme, true);
    setCustomTheme(configObj.customTheme, true);
    setCustomThemeColors(configObj.customThemeColors, true);
    setQuickTabMode(configObj.quickTab, true);
    setPunctuation(configObj.punctuation, true);
    setKeyTips(configObj.showKeyTips, true);
    changeTimeConfig(configObj.time, true);
    changeWordCount(configObj.words, true);
    changeMode(configObj.mode, true);
    changeLanguage(configObj.language, true);
    changeLayout(configObj.layout, true);
    changeFontSize(configObj.fontSize, true);
    setFreedomMode(configObj.freedomMode, true);
    setCaretStyle(configObj.caretStyle, true);
    setDifficulty(configObj.difficulty, true);
    setBlindMode(configObj.blindMode, true);
    setQuickEnd(configObj.quickEnd, true);
    setFlipTestColors(configObj.flipTestColors, true);
    setDiscordDot(configObj.hideDiscordDot, true);
    setColorfulMode(configObj.colorfulMode, true);
    setMaxConfidence(configObj.maxConfidence, true);
    setTimerStyle(configObj.timerStyle, true);
    if (
      configObj.resultFilters == null ||
      configObj.resultFilters == undefined
    ) {
      configObj.resultFilters = ["all"];
    }
    config = configObj;
  }
  Object.keys(defaultConfig).forEach((configKey) => {
    if (config[configKey] == undefined) {
      config[configKey] = defaultConfig[configKey];
    }
  });
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

//difficulty
function setDifficulty(diff, nosave) {
  if (
    (diff !== "normal" && diff !== "expert" && diff !== "master") ||
    diff == undefined
  ) {
    diff = "normal";
  }
  config.difficulty = diff;
  restartTest();
  updateTestModesNotice();
  if (!nosave) saveConfigToCookie();
}

//blind mode
function toggleDiscordDot() {
  dot = !config.showDiscordDot;
  if (dot == undefined) {
    dot = false;
  }
  config.showDiscordDot = dot;
  if (!dot) {
    $("#menu .discord").addClass("dotHidden");
  } else {
    $("#menu .discord").removeClass("dotHidden");
  }
  saveConfigToCookie();
}

function setDiscordDot(dot, nosave) {
  if (dot == undefined) {
    dot = false;
  }
  config.showDiscordDot = dot;
  if (!dot) {
    $("#menu .discord").addClass("dotHidden");
  } else {
    $("#menu .discord").removeClass("dotHidden");
  }
  if (!nosave) saveConfigToCookie();
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

function setCaretStyle(caretStyle, nosave) {
  if (caretStyle == null || caretStyle == undefined) {
    caretStyle = "default";
  }
  config.caretStyle = caretStyle;
  $("#caret").removeClass("default");
  $("#caret").removeClass("underline");
  $("#caret").removeClass("outline");
  $("#caret").removeClass("block");

  if (caretStyle == "default") {
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

function setTimerStyle(style, nosave) {
  if (style == null || style == undefined) {
    style = "bar";
  }
  config.timerStyle = style;
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

function changeWordCount(wordCount, nosave) {
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

//freedom
function setFreedomMode(freedom, nosave) {
  if (freedom === null) {
    freedom = false;
  }
  config.freedomMode = freedom;
  if (config.freedomMode && config.maxConfidence) {
    config.maxConfidence = false;
  }
  if (!nosave) saveConfigToCookie();
}

function toggleFreedomMode() {
  config.freedomMode = !config.freedomMode;
  if (config.freedomMode && config.maxConfidence) {
    config.maxConfidence = false;
  }
  saveConfigToCookie();
}

//max confidence
function toggleMaxConfidence() {
  // console.log(config.maxConfidence)
  mc = !config.maxConfidence;
  if (mc == undefined) {
    mc = false;
  }
  config.maxConfidence = mc;
  if (config.freedomMode && config.maxConfidence) {
    config.freedomMode = false;
  }
  // console.log(config.maxConfidence);
  saveConfigToCookie();
}

function setMaxConfidence(mc, nosave) {
  if (mc == undefined) {
    mc = false;
  }
  config.maxConfidence = mc;
  if (config.freedomMode && config.maxConfidence) {
    config.freedomMode = false;
  }
  if (!nosave) saveConfigToCookie();
}

function previewTheme(name) {
  $("#currentTheme").attr("href", `themes/${name}.css`);
}

function setTheme(name, nosave) {
  config.theme = name;
  $("#currentTheme").attr("href", `themes/${name}.css`);
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
  if (!nosave) saveConfigToCookie();
}

function randomiseTheme() {
  let randomtheme = themesList[Math.floor(Math.random() * themesList.length)];
  setTheme(randomtheme.name, true);
}

function setRandomTheme(bool, nosave) {
  if (bool == undefined) {
    bool = false;
  }
  config.randomTheme = bool;
  if (!nosave) saveConfigToCookie();
}

function toggleRandomTheme() {
  config.randomTheme = !config.randomTheme;
  saveConfigToCookie();
}

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
    colorVars.forEach((e, index) => {
      document.documentElement.style.setProperty(e, array[index]);
    });
  } else {
    colorVars.forEach((e) => {
      document.documentElement.style.setProperty(e, "");
    });
  }

  setTimeout(() => {
    updateFavicon(32, 14);
  }, 500);
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

function changeLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.layout = layout;
  if (!nosave) saveConfigToCookie();
}

function changeFontSize(fontSize, nosave) {
  if (fontSize == null || fontSize == undefined) {
    fontSize = 1;
  }
  // $("#words").stop(true, true).animate({ opacity: 0 }, 125, e => {
  config.fontSize = fontSize;
  $("#words").removeClass("size125");
  $("#caret").removeClass("size125");
  $("#words").removeClass("size15");
  $("#caret").removeClass("size15");
  $("#words").removeClass("size2");
  $("#caret").removeClass("size2");

  if (fontSize == 125) {
    $("#words").addClass("size125");
    $("#caret").addClass("size125");
  } else if (fontSize == 15) {
    $("#words").addClass("size15");
    $("#caret").addClass("size15");
  } else if (fontSize == 2) {
    $("#words").addClass("size2");
    $("#caret").addClass("size2");
  }
  if (!nosave) saveConfigToCookie();
  // restartTest();
  // });
}
