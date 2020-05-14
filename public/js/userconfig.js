let config = {
    theme: 'light',
    showKeyTips: true,
    showLiveWpm: true,
    smoothCaret: true,
    quickTab: false,
    punctuation: true,
    words: 100,
    time: 30,
    mode: "words"
}

//cookies
function saveConfigToCookie() {
    let d = new Date();
    d.setFullYear(d.getFullYear() + 1)
    $.cookie("config", JSON.stringify(config), { expires: d })
}

function loadConfigFromCookie() {
    let newConfig = $.cookie('config');
    if (newConfig) {
        newConfig = JSON.parse(newConfig);
        config = newConfig;
        setTheme(config.theme);
        setQuickTabMode(config.quickTab);
        setPunctuation(config.punctuation);
        setKeyTips(config.showKeyTips);
        changeTimeConfig(config.time);
        changeWordCount(config.words);
        changeMode(config.mode);
        restartTest();
    }
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
}
