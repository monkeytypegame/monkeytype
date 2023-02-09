import * as Misc from "../utils/misc";
import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as Skeleton from "./skeleton";

const wrapperId = "wordFilterPopupWrapper";

let initialised = false;

async function init(): Promise<void> {
  if (!initialised) {
    $("#wordFilterPopup .languageInput").empty();

    let LanguageList;
    try {
      LanguageList = await Misc.getLanguageList();
    } catch (e) {
      console.error(
        Misc.createErrorMessage(
          e,
          "Failed to initialise word filter popup language list"
        )
      );
      return;
    }

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

let callbackFuncOnHide: (() => void) | undefined = undefined;

export async function show(
  noAnim = false,
  callbackOnHide: () => void | undefined
): Promise<void> {
  Skeleton.append(wrapperId);
  if (!Misc.isPopupVisible(wrapperId)) {
    await init();
    callbackFuncOnHide = callbackOnHide;
    $("#wordFilterPopup .languageInput").select2({
      width: "100%",
    });
    $("#wordFilterPopupWrapper .loadingIndicator").addClass("hidden");
    $("#wordFilterPopupWrapper .button").removeClass("hidden");

    $("#wordFilterPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 125, () => {
        //
      });
  }
}

function hide(noAnim = false): void {
  if (Misc.isPopupVisible(wrapperId)) {
    $("#wordFilterPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 125,
        () => {
          $("#wordFilterPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
          if (callbackFuncOnHide) callbackFuncOnHide();
        }
      );
  }
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

  let languageWordList;
  try {
    languageWordList = await Misc.getLanguage(language);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to filter language words"),
      -1
    );
    return [];
  }

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

  CustomText.setPopupTextareaState(
    (set ? "" : CustomText.popupTextareaState + " ") + customText
  );
  hide(true);
}

$("#wordFilterPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "wordFilterPopupWrapper") {
    hide(true);
  }
});

$("#wordFilterPopup .languageInput").one("select2:open", function () {
  $("input.select2-search__field").prop("placeholder", "search");
});

$("#wordFilterPopupWrapper .button").on("mousedown", (e) => {
  $("#wordFilterPopupWrapper .loadingIndicator").removeClass("hidden");
  $("#wordFilterPopupWrapper .button").addClass("hidden");
  setTimeout(() => {
    apply($(e.target).is("#set"));
  }, 1);
});

Skeleton.save(wrapperId);
