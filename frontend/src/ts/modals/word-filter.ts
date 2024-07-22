import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
// @ts-expect-error TODO: update slim-select
import SlimSelect from "slim-select";
import AnimatedModal, {
  HideOptions,
  ShowOptions,
} from "../utils/animated-modal";

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

async function initSelectOptions(): Promise<void> {
  $("#wordFilterModal .languageInput").empty();

  $("#wordFilterModal .layoutInput").empty();

  $("wordFilterModal .presetInput").empty();

  let LanguageList;
  let LayoutList;

  try {
    LanguageList = await JSONData.getLanguageList();
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
    LayoutList = await JSONData.getLayoutsList();
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
    $("#wordFilterModal .languageInput").append(`
        <option value=${language}>${prettyLang}</option>
      `);
  });

  for (const layout in LayoutList) {
    const prettyLayout = layout.replace(/_/gi, " ");
    $("#wordFilterModal .layoutInput").append(`
      <option value=${layout}>${prettyLayout}</option>
    `);
  }

  for (const [presetId, preset] of Object.entries(presets)) {
    $("#wordFilterModal .presetInput").append(
      `<option value=${presetId}>${preset.display}</option>`
    );
  }
}

let languageSelect: SlimSelect | undefined = undefined;
let layoutSelect: SlimSelect | undefined = undefined;
let presetSelect: SlimSelect | undefined = undefined;

export async function show(showOptions?: ShowOptions): Promise<void> {
  void modal.show({
    ...showOptions,
    beforeAnimation: async (modalEl) => {
      languageSelect = new SlimSelect({
        select: "#wordFilterModal .languageInput",
        settings: {
          contentLocation: modalEl,
        },
      });
      layoutSelect = new SlimSelect({
        select: "#wordFilterModal .layoutInput",
        settings: {
          contentLocation: modal.getModal(),
        },
      });
      presetSelect = new SlimSelect({
        select: "#wordFilterModal .presetInput",
        settings: {
          contentLocation: modal.getModal(),
        },
      });
      $("#wordFilterModal .loadingIndicator").removeClass("hidden");
      enableButtons();
    },
  });
}

function hide(hideOptions?: HideOptions<OutgoingData>): void {
  void modal.hide({
    ...hideOptions,
    afterAnimation: async () => {
      languageSelect?.destroy();
      layoutSelect?.destroy();
      presetSelect?.destroy();
      languageSelect = undefined;
      layoutSelect = undefined;
      presetSelect = undefined;
    },
  });
}

async function filter(language: string): Promise<string[]> {
  let filterin = $("#wordFilterModal .wordIncludeInput").val() as string;
  filterin = Misc.escapeRegExp(filterin?.trim());
  filterin = filterin.replace(/\s+/gi, "|");
  const regincl = new RegExp(filterin, "i");
  let filterout = $("#wordFilterModal .wordExcludeInput").val() as string;
  filterout = Misc.escapeRegExp(filterout.trim());
  filterout = filterout.replace(/\s+/gi, "|");
  const regexcl = new RegExp(filterout, "i");
  const filteredWords = [];

  let languageWordList;
  try {
    languageWordList = await JSONData.getLanguage(language);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to filter language words"),
      -1
    );
    return [];
  }

  const maxLengthInput = $("#wordFilterModal .wordMaxInput").val() as string;
  const minLengthInput = $("#wordFilterModal .wordMinInput").val() as string;
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
  const language = $("#wordFilterModal .languageInput").val() as string;
  const filteredWords = await filter(language);

  if (filteredWords.length === 0) {
    Notifications.add("No words found", 0);
    enableButtons();
    return;
  }

  const customText = filteredWords.join(
    CustomText.getPipeDelimiter() ? "|" : " "
  );

  hide({
    modalChainData: {
      text: customText,
      set,
    },
  });
}

function disableButtons(): void {
  for (const button of modal.getModal().querySelectorAll("button")) {
    button.setAttribute("disabled", "true");
  }
}

function enableButtons(): void {
  for (const button of modal.getModal().querySelectorAll("button")) {
    button.removeAttribute("disabled");
  }
}

async function setup(): Promise<void> {
  await initSelectOptions();

  $("#wordFilterModal button.generateButton").on("click", async () => {
    const presetName = $("#wordFilterModal .presetInput").val() as string;
    const layoutName = $("#wordFilterModal .layoutInput").val() as string;

    const presetToApply = presets[presetName];

    if (presetToApply === undefined) {
      Notifications.add(`Preset ${presetName} not found`, -1);
      return;
    }

    const layout = await JSONData.getLayout(layoutName);

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
  $("#wordFilterModal button.addButton").on("click", () => {
    $("#wordFilterModal .loadingIndicator").removeClass("hidden");
    disableButtons();
    setTimeout(() => {
      void apply(false);
    }, 0);
  });

  $("#wordFilterModal button.setButton").on("click", () => {
    $("#wordFilterModal .loadingIndicator").removeClass("hidden");
    disableButtons();
    setTimeout(() => {
      void apply(true);
    }, 0);
  });
}

type OutgoingData = {
  text: string;
  set: boolean;
};

const modal = new AnimatedModal<unknown, OutgoingData>({
  dialogId: "wordFilterModal",
  setup,
});
