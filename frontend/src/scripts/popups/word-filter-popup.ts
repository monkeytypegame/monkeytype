import * as Misc from "../misc";
import * as CustomText from "../test/custom-text";

let initialised = false;

async function init(): Promise<void> {
  if (!initialised) {
    $("#wordFilterPopup .languageInput").empty();
    const LanguageList = await Misc.getLanguageList();
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

export async function show(): Promise<void> {
  await init();
  $("#wordFilterPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
  $("#wordFilterPopup .languageInput").select2({
    width: "100%",
  });
}

function hide(): void {
  $("#wordFilterPopupWrapper").addClass("hidden");
  $("#customTextPopupWrapper").removeClass("hidden");
}

async function filter(language: string): Promise<string[]> {
  let filterin = $("#wordFilterPopup .wordIncludeInput").val() as string;
  filterin = Misc.escapeRegExp(filterin?.trim());
  filterin = filterin.replace(/\s+/gi, "|");
  const regincl = new RegExp(filterin, "i");
  let filterout = $("#wordFilterPopup .wordExcludeInput").val() as string;
  filterout = Misc.escapeRegExp(filterout.trim());
  filterout = filterout.replace(/\s+/gi, "|");
  const regexcl = new RegExp(filterout, "i");
  const filteredWords = [];
  const languageWordList = await Misc.getLanguage(language);
  const maxLengthInput = $("#wordFilterPopup .wordMaxInput").val() as string;
  const minLengthInput = $("#wordFilterPopup .wordMinInput").val() as string;
  let maxLength;
  let minLength;
  if (maxLengthInput == "") {
    maxLength = 999;
  } else {
    maxLength = parseInt(maxLengthInput);
  }
  if (minLengthInput == "") {
    minLength = 1;
  } else {
    minLength = parseInt(minLengthInput);
  }
  for (let i = 0; i < languageWordList.words.length; i++) {
    const word = languageWordList.words[i];
    const test1 = regincl.test(word);
    const test2 = regexcl.test(word);
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

async function apply(set: boolean): Promise<void> {
  const language = $("#wordFilterPopup .languageInput").val() as string;
  const filteredWords = await filter(language);
  const customText = filteredWords.join(CustomText.delimiter);

  $("#customTextPopup textarea").val(
    (_, val) => (set ? "" : val + " ") + customText
  );
  hide();
}

$("#wordFilterPopupWrapper").mousedown((e) => {
  if ($(e.target).attr("id") === "wordFilterPopupWrapper") {
    hide();
  }
});

$("#wordFilterPopup .languageInput").one("select2:open", function () {
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
