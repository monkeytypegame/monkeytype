import * as Misc from "../misc";
import * as CustomText from "../test/custom-text";

let initialised = false;

async function init() {
  if (!initialised) {
    $("#wordFilterPopup .languageInput").empty();
    let LanguageList = await Misc.getLanguageList();
    LanguageList.forEach((language) => {
      let prettyLang = language;
      prettyLang = prettyLang.replace("_", " ");
      $("#wordFilterPopup .languageInput").append(`
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
  $("#wordFilterPopup .languageInput").select2({
    width: "100%",
  });
}

function hide() {
  $("#wordFilterPopupWrapper").addClass("hidden");
  $("#customTextPopupWrapper").removeClass("hidden");
}

async function filter(language) {
  let filterin = $("#wordFilterPopup .wordIncludeInput").val();
  filterin = Misc.escapeRegExp(filterin.trim());
  filterin = filterin.replace(/\s+/gi, "|");
  let regincl = new RegExp(filterin, "i");
  let filterout = $("#wordFilterPopup .wordExcludeInput").val();
  filterout = Misc.escapeRegExp(filterout.trim());
  filterout = filterout.replace(/\s+/gi, "|");
  let regexcl = new RegExp(filterout, "i");
  let filteredWords = [];
  let languageWordList = await Misc.getLanguage(language);
  let maxLength = $("#wordFilterPopup .wordMaxInput").val();
  let minLength = $("#wordFilterPopup .wordMinInput").val();
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

async function apply(set) {
  let language = $("#wordFilterPopup .languageInput").val();
  let filteredWords = await filter(language);
  let customText = filteredWords.join(CustomText.delimiter);

  $("#customTextPopup textarea").val(
    (index, val) => (set ? "" : val + " ") + customText
  );
  hide();
}

$("#wordFilterPopupWrapper").mousedown((e) => {
  if ($(e.target).attr("id") === "wordFilterPopupWrapper") {
    hide();
  }
});

$("#wordFilterPopup .languageInput").one("select2:open", function (e) {
  $("input.select2-search__field").prop("placeholder", "search");
});

$("#wordFilterPopupWrapper .button").mousedown((e) => {
  $("#wordFilterPopupWrapper .loadingIndicator").removeClass("hidden");
  $("#wordFilterPopupWrapper .button").addClass("hidden");
  setTimeout(() => {
    apply($(e.target).is("#set")).then(() => {
      $("#wordFilterPopupWrapper .loadingIndicator").addClass("hidden");
      $("#wordFilterPopupWrapper .button").removeClass("hidden");
    });
  }, 1);
});
