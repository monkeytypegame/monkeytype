import * as Misc from "./misc";

let initialised = false;

async function init() {
  if (!initialised) {
    $("#languageList").empty();
    let LanguageList = await Misc.getLanguageList();
    LanguageList.forEach((language) => {
      let prettyLang = language;
      prettyLang = prettyLang.replace("_", " ");
      $("#languageList").append(`
        <option value=${language}>${prettyLang}</option>
      `);
    });
    initialised = true;
  }
}

export async function show() {
  await init();
  $("#wordFilterPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
  $("#languageList").select2({
    width: "100%",
  });
}

function hide() {
  $("#wordFilterPopupWrapper").addClass("hidden");
  $("#customTextPopupWrapper").removeClass("hidden");
}

async function apply() {
  let language = $("#languageList").val();
  let filteredWords = await filter(language);
  let customText = "";
  filteredWords.forEach((word) => {
    customText += word + " ";
  });
  hide();
  $("#customTextPopup textarea").val(customText);
}

$("#wordFilterPopupWrapper").mousedown((e) => {
  if ($(e.target).attr("id") === "wordFilterPopupWrapper") {
    hide();
  }
});

$("#wordFilterPopupWrapper .button").mousedown((e) => {
  $("#wordFilterPopupWrapper .loadingIndicator").removeClass("hidden");
  $("#wordFilterPopupWrapper .button").addClass("hidden");
  setTimeout(() => {
    apply();
    $("#wordFilterPopupWrapper .loadingIndicator").addClass("hidden");
    $("#wordFilterPopupWrapper .button").removeClass("hidden");
  }, 1);
});

async function filter(language) {
  let filterin = $("#wordFilter").val();
  filterin = filterin.trim();
  filterin = filterin.replace(/ /gi, "|");
  let regincl = new RegExp(filterin, "i");
  let filterout = $("#wordExclude").val();
  filterout = filterout.trim();
  filterout = filterout.replace(/ /gi, "|");
  let regexcl = new RegExp(filterout, "i");
  let filteredWords = [];
  let languageWordList = await Misc.getLanguage(language);
  let maxLength = $("#wordMax").val();
  let minLength = $("#wordMin").val();
  if (maxLength == "") {
    maxLength = 999;
  }
  if (minLength == "") {
    minLength = 1;
  }
  for (let i = 0; i < languageWordList.words.length; i++) {
    let word = languageWordList.words[i];
    let test1 = regincl.test(word);
    let test2 = regexcl.test(word);
    if (
      ((test1 && !test2) || (test1 && filterout == "")) &&
      word.length <= maxLength &&
      word.length >= minLength
    ) {
      filteredWords.push(word);
    }
  }
  return filteredWords;
}

$("#languageList").one("select2:open", function (e) {
  $("input.select2-search__field").prop("placeholder", "search");
});
