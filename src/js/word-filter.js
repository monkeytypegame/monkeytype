import * as Misc from "./misc";
//import * as config from "./userconfig";

export async function showWordFilterPopup(){

    $("#wordFilterPopupWrapper").removeClass("hidden");
    $("#customTextPopupWrapper").addClass("hidden");
    let LanguageList = await Misc.getLanguageList();
    LanguageList.forEach(language => {
        let prettyLang = language;
        prettyLang = prettyLang.replace("_", " ");
        $("#languageList").append(`
            <option value=${language}>${prettyLang}</option>
        `)
    })
}

function hideWordFilterPopup(){
    $("#wordFilterPopupWrapper").addClass("hidden");
    $("#customTextPopupWrapper").removeClass("hidden");
}

async function applyWordFilterPopup(){
    let language = $("#languageList").val();
    let filteredWords = await filter(language);
    let customText = "";
    filteredWords.forEach( word => {
        customText += (word + " ");
    })
    hideWordFilterPopup();
    $("#customTextPopup textarea").val(customText);
}

$("#wordFilterPopupWrapper").mousedown((e) => {
    if ($(e.target).attr("id") === "wordFilterPopupWrapper") {
      hideWordFilterPopup();
    }
});

$("#wordFilterPopupWrapper .button").mousedown((e) => {
    $("#wordFilterPopupWrapper .wfload").removeClass("hidden");
    $("#wordFilterPopupWrapper .button").addClass("hidden");
    setTimeout(() => {
        applyWordFilterPopup();
        $("#wordFilterPopupWrapper .wfload").addClass("hidden");
        $("#wordFilterPopupWrapper .button").removeClass("hidden");
    }, 1)
});

async function filter(language){
    let filterin = $("#wordFilter").val();
    filterin = filterin.replace(/ /gi, "|");
    let regincl = new RegExp(filterin, "i");
    let filterout = $("#wordExclude").val();
    filterout = filterout.replace(/ /gi, "|");
    let regexcl = new RegExp(filterout, "i");
    let filteredWords = [];
    let languageWordList = await Misc.getLanguage(language);
    let maxLength = $("#wordMax").val();
    let minLength = $("#wordMin").val();
    if(maxLength == ""){
        maxLength = 999;
    }
    if(minLength == ""){
        minLength = 1;
    }
    for( let i = 0; i < languageWordList.words.length; i++){
        let word = languageWordList.words[i];
        let test1 = regincl.test(word);
        let test2 = regexcl.test(word);
        if((test1 && !test2 || test1 && filterout == "") && word.length <= maxLength && word.length >= minLength){
            filteredWords.push(word);
            console.log(test1, test2, word, filterout, filterin, regexcl);
        }
    }
    return filteredWords;
}