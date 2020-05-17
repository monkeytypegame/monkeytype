let config = {
    theme: 'dark',
    showKeyTips: true,
    showLiveWpm: false,
    smoothCaret: true,
    quickTab: false,
    punctuation: false,
    words: 50,
    time: 30,
    mode: "words",
    language: "english"
}

//cookies
function saveConfigToCookie() {
    let d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    $.cookie("config", JSON.stringify(config), { expires: d });
    restartCount = 0;
}

function loadConfigFromCookie() {
    let newConfig = $.cookie('config');
    if (newConfig) {
        newConfig = JSON.parse(newConfig);
        setTheme(newConfig.theme);
        setQuickTabMode(newConfig.quickTab);
        setPunctuation(newConfig.punctuation);
        setKeyTips(newConfig.showKeyTips);
        changeTimeConfig(newConfig.time);
        changeWordCount(newConfig.words);
        changeMode(newConfig.mode);
        changeLanguage(newConfig.language);
        config = newConfig;
        restartTest();
    }
}

function showTestConfig() {
    $("#top .config").removeClass('hidden').css("opacity",1);
  }

function hideTestConfig() {
  $("#top .config").css("opacity",0).addClass('hidden');
    
}

//key tips
function setKeyTips(keyTips) {
    config.showKeyTips = keyTips;
    if (config.showKeyTips) {
        $("#bottom .keyTips").removeClass("hidden");
    } else {
        $("#bottom .keyTips").addClass("hidden");
    }
    saveConfigToCookie();
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

//caret
function setSmoothCaret(mode) {
    config.smoothCaret = mode;
    saveConfigToCookie();
}

function toggleSmoothCaret() {
    config.smoothCaret = !config.smoothCaret;
    saveConfigToCookie();
}

//quick tab
function setQuickTabMode(mode) {
    config.quickTab = mode;
    if (!config.quickTab) {
        // $(".pageTest").append('<div id="restartTestButton" class="" tabindex="0"><i class="fas fa-redo-alt"></i></div>');
        $("#restartTestButton").removeClass('hidden');
        $("#restartTestButton").css("opacity", 1);
        $("#bottom .keyTips").html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);

    } else {
        $("#restartTestButton").remove();
        $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
    }
    saveConfigToCookie();
}

function toggleQuickTabMode() {
    config.quickTab = !config.quickTab;
    if (!config.quickTab) {
        $(".pageTest").append('<div id="restartTestButton" class="" tabindex="0"><i class="fas fa-redo-alt"></i></div>');
        $("#restartTestButton").css("opacity", 1);
        $("#bottom .keyTips").html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);

    } else {
        $("#restartTestButton").remove();
        $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
    }
    saveConfigToCookie();
}

//punctuation
function setPunctuation(punc) {
    config.punctuation = punc;
    if (!config.punctuation) {
        $("#top .config .punctuationMode .button").removeClass("active");
    } else {
        $("#top .config .punctuationMode .button").addClass("active");
    }
    saveConfigToCookie();
}

function togglePunctuation() {
    if (config.punctuation) {
        $("#top .config .punctuationMode .button").removeClass("active");
    } else {
        $("#top .config .punctuationMode .button").addClass("active");
    }
    config.punctuation = !config.punctuation;
    saveConfigToCookie();
}

function previewTheme(name) {
    $("#currentTheme").attr("href", `themes/${name}.css`);
}

function setTheme(name) {
    config.theme = name;
    $("#currentTheme").attr("href", `themes/${name}.css`);
    firebase.analytics().logEvent('changedTheme', {
        theme: name
    });
}

function changeLanguage(language) {
    if (language == null || language == undefined) {
        language = "english";
    }
    config.language = language;
    firebase.analytics().logEvent('changedLanguage', {
        language: language
    });
    saveConfigToCookie();
}
