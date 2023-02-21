import * as Misc from "../utils/misc";
import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as Skeleton from "./skeleton";

const wrapperId = "wordFilterPopupWrapper";

let initialised = false;

async function init(): Promise<void> {
  if (!initialised) {
    $("#wordFilterPopup .languageInput").empty();

    $("#wordFilterPopup .layoutInput").empty();

    $("wordFilterPopup .presetInput").empty();

    let LanguageList;
    let LayoutList;

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

    try {
      LayoutList = await Misc.getLayoutsList();
    } catch (e) {
      console.error(
        Misc.createErrorMessage(
          e,
          "Failed to initialise word filter popup preset list"
        )
      );
      return;
    }

    for (let layout in LayoutList) {
      $("#wordFilterPopup .layoutInput").append(`
      <option value=${layout}>${layout}</option>
    `);
    }

    let PresetList = [
      "left hand",
      "right hand",
      "home row",
      "top row",
      "bottom row",
    ];

    PresetList.map((preset) => {
      $("#wordFilterPopup .presetInput").append(`
      <option value=${preset}>${preset}</option>
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

    $("#wordFilterPopup .layoutInput").select2({
      width: "100%",
    });

    $("#wordFilterPopup .presetInput").select2({
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

$("#wordFilterPopupWrapper .button.addButton").on("mousedown", () => {
  $("#wordFilterPopupWrapper .loadingIndicator").removeClass("hidden");
  $("#wordFilterPopupWrapper .button").addClass("hidden");
  apply(false);
});

$("#wordFilterPopupWrapper .button.setButton").on("mousedown", () => {
  $("#wordFilterPopupWrapper .loadingIndicator").removeClass("hidden");
  $("#wordFilterPopupWrapper .button").addClass("hidden");
  apply(true);
});

$("#wordFilterPopup .button.generateButton").on("click", function () {
  const presetName = $("#wordFilterPopup .presetInput").val() as string;
  const layoutName = $("#wordFilterPopup .layoutInput").val() as string;

  const combine = (include: string[], exclude: string[]) => {
    let includeCharacters = "";
    let excludeCharacters = "";

    include.forEach((letter) => {
      includeCharacters += letter[0] + " ";
    });

    exclude.forEach((letter) => {
      excludeCharacters += letter[0] + " ";
    });

    $("#wordIncludeInput").val(includeCharacters);
    $("#wordExcludeInput").val(excludeCharacters);
  };

  const left = async () => {
    const layout = await Misc.getLayout(layoutName);

    const topRowInclude = layout.keys.row2.slice(0, 5);
    const homeRowInclude = layout.keys.row3.slice(0, 5);
    const bottomRowInclude = layout.keys.row4.slice(0, 5);

    const topRowExclude = layout.keys.row2.slice(5);
    const homeRowExclude = layout.keys.row3.slice(5);
    const bottomRowExclude = layout.keys.row4.slice(5);

    const include = topRowInclude.concat(homeRowInclude, bottomRowInclude);
    const exclude = topRowExclude.concat(homeRowExclude, bottomRowExclude);

    combine(include, exclude);
  };
  const right = async () => {
    const layout = await Misc.getLayout(layoutName);
    const topRowInclude = layout.keys.row2.slice(5);
    const homeRowInclude = layout.keys.row3.slice(5);
    const bottomRowInclude = layout.keys.row4.slice(5);

    const topRowExclude = layout.keys.row2.slice(0, 5);
    const homeRowExclude = layout.keys.row3.slice(0, 5);
    const bottomRowExclude = layout.keys.row4.slice(0, 5);

    const include = topRowInclude.concat(homeRowInclude, bottomRowInclude);
    const exclude = topRowExclude.concat(homeRowExclude, bottomRowExclude);

    combine(include, exclude);
  };

  const home = async () => {
    const layout = await Misc.getLayout(layoutName);

    const homeRow = layout.keys.row3;
    const topRow = layout.keys.row2;
    const bottomRow = layout.keys.row4;

    const include = homeRow;
    const exclude = topRow.concat(bottomRow);

    combine(include, exclude);
  };

  const top = async () => {
    const layout = await Misc.getLayout(layoutName);

    const homeRow = layout.keys.row3;
    const topRow = layout.keys.row2;
    const bottomRow = layout.keys.row4;

    const include = topRow;
    const exclude = homeRow.concat(bottomRow);

    combine(include, exclude);
  };

  const bottom = async () => {
    const layout = await Misc.getLayout(layoutName);

    const homeRow = layout.keys.row3;
    const topRow = layout.keys.row2;
    const bottomRow = layout.keys.row4;

    const include = bottomRow;
    const exclude = homeRow.concat(topRow);

    combine(include, exclude);
  };

  if (presetName == "left") {
    left();
  } else if (presetName == "right") {
    right();
  } else if (presetName == "home") {
    home();
  } else if (presetName == "top") {
    top();
  } else if (presetName == "bottom") {
    bottom();
  }
});

Skeleton.save(wrapperId);
