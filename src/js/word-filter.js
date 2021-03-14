import * as Misc from "./misc";

function showWordFilterPopup(hideCustomTextPopup){
    $("#wordFilterPopupWrapper").removeclass("hidden");
}

export async function filter(language, filter){
    filter = filter.replace(/ /gi, "|");
    let reg = new RegExp(filter, "gi");
    let filteredWords = [];
    let languageList = await Misc.getLanguage(language);
    languageList.words.forEach( word => {
        let test = reg.test(word);
        if(test){
            filteredWords.push(word);
        }
    })
    return filteredWords;
}



