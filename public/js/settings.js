function updateSettingsPage(){

    let themesEl = $(".pageSettings .section .themes").empty();
    themesList.forEach(theme => {
        if (config.theme == 'theme') {
            themesEl.append(`<div class="theme active" theme='${theme}'>${theme.replace('_', ' ')}</div>`);     
        } else {
            themesEl.append(`<div class="theme" theme='${theme}'>${theme.replace('_', ' ')}</div>`); 
        }
    })



    setSettingsButton('smoothCaret', config.smoothCaret);
    setSettingsButton('quickTab', config.quickTab);
    setSettingsButton('liveWpm', config.showLiveWpm);
    setSettingsButton('keyTips', config.showKeyTips);

    if (config.showKeyTips) {
        $(".pageSettings .tip").removeClass('hidden');
    } else {
        $(".pageSettings .tip").addClass('hidden');
    }


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
    showNotification('Live WPM on', 1000);
    setSettingsButton('liveWpm', config.showLiveWpm);
})
$(".pageSettings .section.liveWpm .buttons .button.off").click(e => {
    config.showLiveWpm = false;
    showNotification('Live WPM off', 1000);
    setSettingsButton('liveWpm', config.showLiveWpm);
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

$(document).on("mouseover",".pageSettings .section .themes .theme", (e) => {
    let theme = $(e.currentTarget).attr('theme');
    previewTheme(theme);
})

$(document).on("click",".pageSettings .section .themes .theme", (e) => {
    let theme = $(e.currentTarget).attr('theme');
    setTheme(theme);
})

$(document).on("mouseleave",".pageSettings .section .themes", (e) => {
    setTheme(config.theme);
})