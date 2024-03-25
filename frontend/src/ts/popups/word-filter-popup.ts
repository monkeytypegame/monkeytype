import * as Misc from "../utils/misc";
import * as GetData from "../utils/get-data";
import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as Skeleton from "../utils/skeleton";
import SlimSelect from "slim-select";

const wrapperId = "wordFilterPopupWrapper";

let initialised = false;

type FilterPreset = {
  display: string;
  getIncludeString: (layout: MonkeyTypes.Layout) => string[];
  getExcludeString: (layout: MonkeyTypes.Layout) => string[];
};

const presets: Record<string, FilterPreset> = {
  homeKeys: {
    display: "home keys",
    getIncludeString: (layout) => {
      const homeKeysLeft = layout.keys.row3.slice(0, 4);
      const homeKeysRight = layout.keys.row3.slice(6, 10);
      return [...homeKeysLeft, ...homeKeysRight];
    },
    getExcludeString: (layout) => {
      const topRow = layout.keys.row2;
      const bottomRow = layout.keys.row4;
      const homeRowRight = layout.keys.row3.slice(10);
      const homeRowMiddle = layout.keys.row3.slice(4, 6);
      return [...topRow, ...homeRowMiddle, ...homeRowRight, ...bottomRow];
    },
  },
  leftHand: {
    display: "left hand",
    getIncludeString: (layout) => {
      const topRowInclude = layout.keys.row2.slice(0, 5);
      const homeRowInclude = layout.keys.row3.slice(0, 5);
      const bottomRowInclude = layout.keys.row4.slice(0, 5);
      return [...topRowInclude, ...homeRowInclude, ...bottomRowInclude];
    },
    getExcludeString: (layout) => {
      const topRowExclude = layout.keys.row2.slice(5);
      const homeRowExclude = layout.keys.row3.slice(5);
      const bottomRowExclude = layout.keys.row4.slice(5);
      return [...topRowExclude, ...homeRowExclude, ...bottomRowExclude];
    },
  },
  rightHand: {
    display: "right hand",
    getIncludeString: (layout) => {
      const topRowInclude = layout.keys.row2.slice(5);
      const homeRowInclude = layout.keys.row3.slice(5);
      const bottomRowInclude = layout.keys.row4.slice(4);
      return [...topRowInclude, ...homeRowInclude, ...bottomRowInclude];
    },
    getExcludeString: (layout) => {
      const topRowExclude = layout.keys.row2.slice(0, 5);
      const homeRowExclude = layout.keys.row3.slice(0, 5);
      const bottomRowExclude = layout.keys.row4.slice(0, 4);
      return [...topRowExclude, ...homeRowExclude, ...bottomRowExclude];
    },
  },
  homeRow: {
    display: "home row",
    getIncludeString: (layout) => {
      return layout.keys.row3;
    },
    getExcludeString: (layout) => {
      const topRowExclude = layout.keys.row2;
      const bottomRowExclude = layout.keys.row4;
      return [...topRowExclude, ...bottomRowExclude];
    },
  },
  topRow: {
    display: "top row",
    getIncludeString: (layout) => {
      return layout.keys.row2;
    },
    getExcludeString: (layout) => {
      const homeRowExclude = layout.keys.row3;
      const bottomRowExclude = layout.keys.row4;
      return [...homeRowExclude, ...bottomRowExclude];
    },
  },
  bottomRow: {
    display: "bottom row",
    getIncludeString: (layout) => {
      return layout.keys.row4;
    },
    getExcludeString: (layout) => {
      const topRowExclude = layout.keys.row2;
      const homeRowExclude = layout.keys.row3;
      return [...topRowExclude, ...homeRowExclude];
    },
  },
};

async function init(): Promise<void> {
  if (!initialised) {
    $("#wordFilterPopup .languageInput").empty();

    $("#wordFilterPopup .layoutInput").empty();

    $("wordFilterPopup .presetInput").empty();

    let LanguageList;
    let LayoutList;

    try {
      LanguageList = await GetData.getLanguageList();
    } catch (e) {
      console.error(
        Misc.createErrorMessage(
          e,
          "Failed to initialise word filter popup language list"
        )
      );
      return;
    }

    try {
      LayoutList = await GetData.getLayoutsList();
    } catch (e) {
      console.error(
        Misc.createErrorMessage(
          e,
          "Failed to initialise word filter popup preset list"
        )
      );
      return;
    }

    LanguageList.forEach((language) => {
      const prettyLang = language.replace(/_/gi, " ");
      $("#wordFilterPopup .languageInput").append(`
        <option value=${language}>${prettyLang}</option>
      `);
    });

    for (const layout in LayoutList) {
      const prettyLayout = layout.replace(/_/gi, " ");
      $("#wordFilterPopup .layoutInput").append(`
      <option value=${layout}>${prettyLayout}</option>
    `);
    }

    for (const [presetId, preset] of Object.entries(presets)) {
      $("#wordFilterPopup .presetInput").append(
        `<option value=${presetId}>${preset.display}</option>`
      );
    }

    initialised = true;
  }
}

let languageSelect: SlimSelect | undefined = undefined;
let layoutSelect: SlimSelect | undefined = undefined;
let presetSelect: SlimSelect | undefined = undefined;

let callbackFuncOnHide: (() => void) | undefined = undefined;

export async function show(
  noAnim = false,
  callbackOnHide: () => void | undefined
): Promise<void> {
  Skeleton.append(wrapperId, "popups");
  if (!Misc.isPopupVisible(wrapperId)) {
    await init();
    callbackFuncOnHide = callbackOnHide;
    languageSelect = new SlimSelect({
      select: "#wordFilterPopup .languageInput",
    });
    layoutSelect = new SlimSelect({
      select: "#wordFilterPopup .layoutInput",
    });
    presetSelect = new SlimSelect({
      select: "#wordFilterPopup .presetInput",
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
          languageSelect?.destroy();
          layoutSelect?.destroy();
          presetSelect?.destroy();
          languageSelect = undefined;
          layoutSelect = undefined;
          presetSelect = undefined;
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
    languageWordList = await GetData.getLanguage(language);
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
  if (maxLengthInput === "") {
    maxLength = 999;
  } else {
    maxLength = parseInt(maxLengthInput);
  }
  if (minLengthInput === "") {
    minLength = 1;
  } else {
    minLength = parseInt(minLengthInput);
  }
  for (const word of languageWordList.words) {
    const test1 = regincl.test(word);
    const test2 = regexcl.test(word);
    if (
      ((test1 && !test2) || (test1 && filterout === "")) &&
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

  if (filteredWords.length === 0) {
    Notifications.add("No words found", 0);
    hide(true);
    return;
  }

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

$("#wordFilterPopupWrapper .button.addButton").on("mousedown", () => {
  $("#wordFilterPopupWrapper .loadingIndicator").removeClass("hidden");
  $("#wordFilterPopupWrapper .button").addClass("hidden");
  void apply(false);
});

$("#wordFilterPopupWrapper .button.setButton").on("mousedown", () => {
  $("#wordFilterPopupWrapper .loadingIndicator").removeClass("hidden");
  $("#wordFilterPopupWrapper .button").addClass("hidden");
  void apply(true);
});

$("#wordFilterPopup .button.generateButton").on("click", async () => {
  const presetName = $("#wordFilterPopup .presetInput").val() as string;
  const layoutName = $("#wordFilterPopup .layoutInput").val() as string;

  const presetToApply = presets[presetName];

  if (presetToApply === undefined) {
    Notifications.add(`Preset ${presetName} not found`, -1);
    return;
  }

  const layout = await GetData.getLayout(layoutName);

  $("#wordIncludeInput").val(
    presetToApply
      .getIncludeString(layout)
      .map((x) => x[0])
      .join(" ")
  );
  $("#wordExcludeInput").val(
    presetToApply
      .getExcludeString(layout)
      .map((x) => x[0])
      .join(" ")
  );
});

Skeleton.save(wrapperId);
