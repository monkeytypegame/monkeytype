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
    language: "english",
    fontSize: 1
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
        changeFontSize(newConfig.fontSize);
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
    updateFavicon(32,14);
    try{
        firebase.analytics().logEvent('changedTheme', {
            theme: name
        });
    }catch(e){
        console.log("Analytics unavailable");
    }
}

function updateFavicon(size, curveSize) {
    let maincolor, bgcolor;
    
    bgcolor = getComputedStyle(document.body).getPropertyValue('--bg-color').replace(' ','');
    maincolor = getComputedStyle(document.body).getPropertyValue('--main-color').replace(' ','');

    if (bgcolor == maincolor) {
        bgcolor = "#111";
        maincolor = "#eee";
    }

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    let ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(0,curveSize);
    //top left
    ctx.quadraticCurveTo(0, 0, curveSize, 0);
    ctx.lineTo(size-curveSize,0);
    //top right
    ctx.quadraticCurveTo(size, 0, size, curveSize);
    ctx.lineTo(size,size-curveSize);
    ctx.quadraticCurveTo(size, size, size-curveSize, size);
    ctx.lineTo(curveSize,size);
    ctx.quadraticCurveTo(0, size, 0, size - curveSize);
    ctx.fillStyle = bgcolor;
    ctx.fill(); 
    ctx.font = "900 "+ size/2*1.2 + "px Roboto Mono";
    ctx.textAlign = "center";
    ctx.fillStyle = maincolor;
    ctx.fillText("mt", size/2+(size/32), size/3*2.1);
    // document.body.appendChild(canvas);
    $("#favicon").attr('href',canvas.toDataURL('image/png'));
}

function changeLanguage(language) {
    if (language == null || language == undefined) {
        language = "english";
    }
    config.language = language;
    try{
        firebase.analytics().logEvent('changedLanguage', {
            language: language
        });
    }catch(e){
        console.log("Analytics unavailable");
    }
    saveConfigToCookie();
}

function changeFontSize(fontSize) {
    if (fontSize == null || fontSize == undefined) {
        fontSize = 1;
    }
    $("#words").stop(true, true).animate({ opacity: 0 }, 125, e => {
        config.fontSize = fontSize;
        $("#words").removeClass('size125');
        $("#caret").removeClass('size125');
        $("#words").removeClass('size15');
        $("#caret").removeClass('size15');
        $("#words").removeClass('size2');
        $("#caret").removeClass('size2');

        if (fontSize == 125) {
            $("#words").addClass('size125');
            $("#caret").addClass('size125');
        } else if (fontSize == 15) {
            $("#words").addClass('size15');     
            $("#caret").addClass('size15');     
        } else if (fontSize == 2) {
            $("#words").addClass('size2');
            $("#caret").addClass('size2');
        }
        saveConfigToCookie();
        restartTest();
    });
}