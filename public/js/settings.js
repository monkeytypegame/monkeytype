function updateSettingsPage(){

    let themesEl = $(".pageSettings .section.themes .buttons").empty();
    themesList.forEach(theme => {
        themesEl.append(`<div class="theme" theme='${theme.name}' style="color:${theme.textColor};background:${theme.bgColor}">${theme.name.replace('_', ' ')}</div>`); 
    })

    let langEl = $(".pageSettings .section.languages .buttons").empty();
    Object.keys(words).forEach(language => {
        langEl.append(`<div class="language" language='${language}'>${language.replace('_', ' ')}</div>`); 
    })

    setSettingsButton('smoothCaret', config.smoothCaret);
    setSettingsButton('quickTab', config.quickTab);
    setSettingsButton('liveWpm', config.showLiveWpm);
    setSettingsButton('keyTips', config.showKeyTips);
    setSettingsButton('freedomMode', config.freedomMode);


    setActiveThemeButton();
    setActiveLanguageButton();
    setActiveFontSizeButton();
    setActiveDifficultyButton();
    setActiveCaretStyleButton();

    if (config.showKeyTips) {
        $(".pageSettings .tip").removeClass('hidden');
    } else {
        $(".pageSettings .tip").addClass('hidden');
    }


}

function setActiveThemeButton() {
    $(`.pageSettings .section.themes .theme`).removeClass('active');
    $(`.pageSettings .section.themes .theme[theme=${config.theme}]`).addClass('active');
}

function setActiveFontSizeButton() {
    $(`.pageSettings .section.fontSize .buttons .button`).removeClass('active');
    $(`.pageSettings .section.fontSize .buttons .button[fontsize=`+config.fontSize+`]`).addClass('active');
}

function setActiveDifficultyButton() {
    $(`.pageSettings .section.difficulty .buttons .button`).removeClass('active');
    $(`.pageSettings .section.difficulty .buttons .button[difficulty=`+config.difficulty+`]`).addClass('active');
}

function setActiveLanguageButton() {
    $(`.pageSettings .section.languages .language`).removeClass('active');
    $(`.pageSettings .section.languages .language[language=${config.language}]`).addClass('active'); 
}

function setActiveCaretStyleButton() {
    $(`.pageSettings .section.caretStyle .buttons .button`).removeClass('active');
    $(`.pageSettings .section.caretStyle .buttons .button[caret=`+config.caretStyle+`]`).addClass('active');
}

function setSettingsButton(buttonSection,tf) {
    if (tf) {
        $(".pageSettings .section."+buttonSection+" .buttons .button.on").addClass('active');
        $(".pageSettings .section."+buttonSection+" .buttons .button.off").removeClass('active');
    } else {
        $(".pageSettings .section."+buttonSection+" .buttons .button.off").addClass('active');
        $(".pageSettings .section."+buttonSection+" .buttons .button.on").removeClass('active');
    }
}


//smooth caret
$(".pageSettings .section.smoothCaret .buttons .button.on").click(e => {
    setSmoothCaret(true);
    showNotification('Smooth caret on', 1000);
    setSettingsButton('smoothCaret', config.smoothCaret);
})
$(".pageSettings .section.smoothCaret .buttons .button.off").click(e => {
    setSmoothCaret(false);
    showNotification('Smooth caret off', 1000);
    setSettingsButton('smoothCaret', config.smoothCaret);
})

//quick tab
$(".pageSettings .section.quickTab .buttons .button.on").click(e => {
    setQuickTabMode(true);
    showNotification('Quick tab on', 1000);
    setSettingsButton('quickTab', config.quickTab);
})
$(".pageSettings .section.quickTab .buttons .button.off").click(e => {
    setQuickTabMode(false);
    showNotification('Quick tab off', 1000);
    setSettingsButton('quickTab', config.quickTab);
})

//live wpm
$(".pageSettings .section.liveWpm .buttons .button.on").click(e => {
    config.showLiveWpm = true;
    saveConfigToCookie();
    showNotification('Live WPM on', 1000);
    setSettingsButton('liveWpm', config.showLiveWpm);
})
$(".pageSettings .section.liveWpm .buttons .button.off").click(e => {
    config.showLiveWpm = false;
    saveConfigToCookie();
    showNotification('Live WPM off', 1000);
    setSettingsButton('liveWpm', config.showLiveWpm);
})

//freedom mode
$(".pageSettings .section.freedomMode .buttons .button.on").click(e => {
    setFreedomMode(true);
    saveConfigToCookie();
    showNotification('Freedom mode on', 1000);
    setSettingsButton('freedomMode', config.freedomMode);
})
$(".pageSettings .section.freedomMode .buttons .button.off").click(e => {
    setFreedomMode(false);
    saveConfigToCookie();
    showNotification('Freedom mode off', 1000);
    setSettingsButton('freedomMode', config.freedomMode);
})

//keytips
$(".pageSettings .section.keyTips .buttons .button.on").click(e => {
    setKeyTips(true);
    showNotification('Key tips on', 1000);
    setSettingsButton('keyTips', config.showKeyTips);
    if (config.showKeyTips) {
        $(".pageSettings .tip").removeClass('hidden');
    } else {
        $(".pageSettings .tip").addClass('hidden');
    }
})
$(".pageSettings .section.keyTips .buttons .button.off").click(e => {
    setKeyTips(false);
    showNotification('Key tips off', 1000);
    setSettingsButton('keyTips', config.showKeyTips);
    if (config.showKeyTips) {
        $(".pageSettings .tip").removeClass('hidden');
    } else {
        $(".pageSettings .tip").addClass('hidden');
    }
})

//themes
// $(document).on("mouseover",".pageSettings .section.themes .theme", (e) => {
//     let theme = $(e.currentTarget).attr('theme');
//     previewTheme(theme);
// })

$(document).on("click",".pageSettings .section.themes .theme", (e) => {
    let theme = $(e.currentTarget).attr('theme');
    setTheme(theme);
    setActiveThemeButton();
})

// $(document).on("mouseleave",".pageSettings .section.themes", (e) => {
//     setTheme(config.theme);
// })

//languages
$(document).on("click",".pageSettings .section.languages .language", (e) => {
    let language = $(e.currentTarget).attr('language');
    changeLanguage(language);
    showNotification('Language changed', 1000);
    restartTest();
    setActiveLanguageButton();
})

//fontsize
$(document).on("click",".pageSettings .section.fontSize .button", (e) => {
    let fontSize = $(e.currentTarget).attr('fontsize');
    changeFontSize(fontSize);
    showNotification('Font size changed', 1000);
    setActiveFontSizeButton();
})

//difficulty
$(document).on("click",".pageSettings .section.difficulty .button", (e) => {
    let difficulty = $(e.currentTarget).attr('difficulty');
    setDifficulty(difficulty);
    showNotification('Difficulty changed', 1000);
    setActiveDifficultyButton();
})

//caret style
$(document).on("click",".pageSettings .section.caretStyle .button", (e) => {
    let caretStyle = $(e.currentTarget).attr('caret');
    setCaretStyle(caretStyle);
    showNotification('Caret style updated', 1000);
    setActiveCaretStyleButton();
})
