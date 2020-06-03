let config = {
    theme: 'serika_dark',
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
    layout:"default"
}

//cookies
function saveConfigToCookie() {
    let d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    $.cookie("config", null);
    $.cookie("config", JSON.stringify(config), {
        expires: d,
        path: '/'
     });
    restartCount = 0;
}

function loadConfigFromCookie() {
    let newConfig = $.cookie('config');
    if (newConfig && newConfig != null && newConfig != "null") {
        newConfig = JSON.parse(newConfig);
        setTheme(newConfig.theme,true);
        setQuickTabMode(newConfig.quickTab,true);
        setPunctuation(newConfig.punctuation,true);
        setKeyTips(newConfig.showKeyTips,true);
        changeTimeConfig(newConfig.time,true);
        changeWordCount(newConfig.words,true);
        changeMode(newConfig.mode,true);
        changeLanguage(newConfig.language,true);
        changeLayout(newConfig.layout, true);
        changeFontSize(newConfig.fontSize,true);
        setFreedomMode(newConfig.freedomMode,true);
        setCaretStyle(newConfig.caretStyle,true);
        setDifficulty(newConfig.difficulty,true);
        setBlindMode(newConfig.blindMode,true);
        setQuickEnd(newConfig.quickEnd,true);
        setFlipTestColors(newConfig.flipTestColors,true);
        if(newConfig.resultFilters == null || newConfig.resultFilters == undefined){
            newConfig.resultFilters = ["all"];
        }
        config = newConfig;
    }
    if(config.difficulty == undefined){
        config.difficulty = "normal";
        saveConfigToCookie();
    }
    if(config.blindMode == undefined){
        config.blindMode = false;
        saveConfigToCookie();
    }
    if(config.layout == undefined){
        config.layout = "default";
        saveConfigToCookie();
    }
}

function showTestConfig() {
    $("#top .config").removeClass('hidden').css("opacity",1);
  }

function hideTestConfig() {
  $("#top .config").css("opacity",0).addClass('hidden');
}

//difficulty
function setDifficulty(diff, nosave){
    if((diff !== "normal" && diff !== "expert" && diff !== "master") || diff == undefined){
        diff = "normal";
    }
    config.difficulty = diff;
    restartTest();
    if(!nosave) saveConfigToCookie();
}

//blind mode
function toggleBlindMode(){
    blind = !config.blindMode;
    if(blind == undefined){
        blind = false;
    }
    config.blindMode = blind;
    saveConfigToCookie();
}

function setBlindMode(blind, nosave){
    if(blind == undefined){
        blind = false;
    }
    config.blindMode = blind;
    if(!nosave) saveConfigToCookie();
}

//quickend
function toggleQuickEnd(){
    qe = !config.quickEnd;
    if(qe == undefined){
        qe = false;
    }
    config.quickEnd = qe;
    saveConfigToCookie();
}

function setQuickEnd(qe, nosave){
    if(qe == undefined){
        qe = false;
    }
    config.quickEnd = qe;
    if(!nosave) saveConfigToCookie();
}


//flip colors
function setFlipTestColors(flip,nosave){
    if(flip == undefined){
        flip = false;
    }
    config.flipTestColors = flip;
    flipTestColors(flip);
    if(!nosave) saveConfigToCookie();
}

function toggleFlipTestColors(){
    config.flipTestColors = !config.flipTestColors;
    flipTestColors(config.flipTestColors);
    saveConfigToCookie();
}

function setCaretStyle(caretStyle, nosave) {
    if (caretStyle == null || caretStyle == undefined) {
        caretStyle = 'default';
    }
    config.caretStyle = caretStyle;
    $("#caret").removeClass('default');
    $("#caret").removeClass('underline');
    $("#caret").removeClass('outline');
    $("#caret").removeClass('block');

    if (caretStyle == 'default') {
        $("#caret").addClass('default');
    } else if (caretStyle == 'block') {   
        $("#caret").addClass('block');     
    } else if (caretStyle == 'outline') {
        $("#caret").addClass('outline');
    } else if (caretStyle == 'underline') {
        $("#caret").addClass('underline');
    }
    if(!nosave) saveConfigToCookie();
}

//key tips
function setKeyTips(keyTips, nosave) {
    config.showKeyTips = keyTips;
    if (config.showKeyTips) {
        $("#bottom .keyTips").removeClass("hidden");
    } else {
        $("#bottom .keyTips").addClass("hidden");
    }
    if(!nosave) saveConfigToCookie();
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
    changeMode("time",nosave);
    config.time = time;
    $("#top .config .time .button").removeClass("active");
    if(![15,30,60,120].includes(time)){
        time = "custom";
    }
    $("#top .config .time .button[timeConfig='" + time + "']").addClass("active");
    if(!nosave) saveConfigToCookie();
}

function changeWordCount(wordCount, nosave) {
    wordCount = parseInt(wordCount);
    changeMode("words", nosave);
    config.words = wordCount;
    $("#top .config .wordCount .button").removeClass("active");
    if(![10,25,50,100,200].includes(wordCount)){
        wordCount = "custom";
    }
    $("#top .config .wordCount .button[wordCount='" + wordCount + "']").addClass(
        "active"
    );
    if(!nosave) saveConfigToCookie();
}

//caret
function setSmoothCaret(mode,nosave) {
    config.smoothCaret = mode;
    if(!nosave) saveConfigToCookie();
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
        $("#restartTestButton").removeClass('hidden');
        $("#restartTestButton").css("opacity", 1);
        $("#bottom .keyTips").html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);

    } else {
        // $("#restartTestButton").remove();
        $("#restartTestButton").addClass('hidden');
        $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
    }
    if(!nosave) saveConfigToCookie();
}

function toggleQuickTabMode() {
    config.quickTab = !config.quickTab;
    if (!config.quickTab) {
        // $(".pageTest").append('<div id="restartTestButton" class="" tabindex="0"><i class="fas fa-redo-alt"></i></div>');
        $("#restartTestButton").removeClass('hidden');
        $("#restartTestButton").css("opacity", 1);
        $("#bottom .keyTips").html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>esc</key> - command line`);

    } else {
        // $("#restartTestButton").remove();
        $("#restartTestButton").addClass('hidden');
        $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
    }
    saveConfigToCookie();
}

//punctuation
function setPunctuation(punc, nosave) {
    config.punctuation = punc;
    if (!config.punctuation) {
        $("#top .config .punctuationMode .button").removeClass("active");
    } else {
        $("#top .config .punctuationMode .button").addClass("active");
    }
    if(!nosave) saveConfigToCookie();
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

//freedom
function setFreedomMode(freedom, nosave) {
    config.freedomMode = freedom;
    if(!nosave) saveConfigToCookie();
}

function toggleFreedomMode() {
    config.freedomMode = !config.freedomMode;
    saveConfigToCookie();
}

function previewTheme(name) {
    $("#currentTheme").attr("href", `themes/${name}.css`);
}

function setTheme(name,nosave) {
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
    if(!nosave) saveConfigToCookie();
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

function changeLanguage(language, nosave) {
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
    if(!nosave) saveConfigToCookie();
}

function changeLayout(layout, nosave){
    if (layout == null || layout == undefined){
        layout = "qwerty"
    }
    config.layout = layout;
    if(!nosave) saveConfigToCookie();
}

function changeFontSize(fontSize, nosave) {
    if (fontSize == null || fontSize == undefined) {
        fontSize = 1;
    }
    // $("#words").stop(true, true).animate({ opacity: 0 }, 125, e => {
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
        if(!nosave) saveConfigToCookie();
        // restartTest();
    // });
}
