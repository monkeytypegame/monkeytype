import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import SlimSelect from "slim-select";
import AnimatedModal, {
  HideOptions,
  ShowOptions,
} from "../utils/animated-modal";
import { LayoutsList } from "../constants/layouts";
import { tryCatch } from "@monkeytype/util/trycatch";
import { LanguageList } from "../constants/languages";
import { Language } from "@monkeytype/schemas/languages";
import { LayoutObject } from "@monkeytype/schemas/layouts";
import { qs, qsr } from "../utils/dom";

type FilterPreset = {
  display: string;
  getIncludeString: (layout: LayoutObject) => string[][];
} & (
  | {
      exactMatch: true;
    }
  | {
      exactMatch?: false;
      getExcludeString?: (layout: LayoutObject) => string[][];
    }
);

const exactMatchCheckbox = qs<HTMLInputElement>(
  "#wordFilterModal #exactMatchOnly",
);

const presets: Record<string, FilterPreset> = {
  homeKeys: {
    display: "home keys",
    getIncludeString: (layout) => {
      const homeKeysLeft = layout.keys.row3.slice(0, 4);
      const homeKeysRight = layout.keys.row3.slice(6, 10);
      return [...homeKeysLeft, ...homeKeysRight];
    },
    exactMatch: true,
  },
  leftHand: {
    display: "left hand",
    getIncludeString: (layout) => {
      const topRowInclude = layout.keys.row2.slice(0, 5);
      const homeRowInclude = layout.keys.row3.slice(0, 5);
      const bottomRowInclude = layout.keys.row4.slice(0, 5);
      return [...topRowInclude, ...homeRowInclude, ...bottomRowInclude];
    },
    exactMatch: true,
  },
  rightHand: {
    display: "right hand",
    getIncludeString: (layout) => {
      const topRowInclude = layout.keys.row2.slice(5);
      const homeRowInclude = layout.keys.row3.slice(5);
      const bottomRowInclude = layout.keys.row4.slice(4);
      return [...topRowInclude, ...homeRowInclude, ...bottomRowInclude];
    },
    exactMatch: true,
  },
  homeRow: {
    display: "home row",
    getIncludeString: (layout) => {
      return layout.keys.row3;
    },
    exactMatch: true,
  },
  topRow: {
    display: "top row",
    getIncludeString: (layout) => {
      return layout.keys.row2;
    },
    exactMatch: true,
  },
  bottomRow: {
    display: "bottom row",
    getIncludeString: (layout) => {
      return layout.keys.row4;
    },
    exactMatch: true,
  },
};

async function initSelectOptions(): Promise<void> {
  const modalEl = modal.getModal();
  modalEl.qsr(".languageInput").empty();
  modalEl.qsr(".layoutInput").empty();
  modalEl.qsr(".presetInput").empty();

  LanguageList.forEach((language) => {
    const prettyLang = language.replace(/_/gi, " ");
    modalEl.qsr(".languageInput").appendHtml(`
        <option value=${language}>${prettyLang}</option>
      `);
  });

  for (const layout of LayoutsList) {
    const prettyLayout = layout.replace(/_/gi, " ");
    modalEl.qsr(".layoutInput").appendHtml(`
      <option value=${layout}>${prettyLayout}</option>
    `);
  }

  for (const [presetId, preset] of Object.entries(presets)) {
    modalEl
      .qsr(".presetInput")
      .appendHtml(`<option value=${presetId}>${preset.display}</option>`);
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
          contentLocation: modalEl.native,
        },
      });
      layoutSelect = new SlimSelect({
        select: "#wordFilterModal .layoutInput",
        settings: {
          contentLocation: modal.getModal().native,
        },
      });
      presetSelect = new SlimSelect({
        select: "#wordFilterModal .presetInput",
        settings: {
          contentLocation: modal.getModal().native,
        },
      });
      modalEl.qs(".loadingIndicator")?.show();
      enableButtons();
    },
  });
}

function hide(hideOptions?: HideOptions<OutgoingData>): void {
  void modal.hide({
    ...hideOptions,
  });
}

async function filter(language: Language): Promise<string[]> {
  const modalEl = modal.getModal();
  const exactMatchOnly = exactMatchCheckbox?.isChecked() as boolean;
  let filterin = modalEl
    .qsr<HTMLInputElement>(".wordIncludeInput")
    .getValue() as string;
  filterin = Misc.escapeRegExp(filterin?.trim());
  filterin = filterin.replace(/\s+/gi, "|");
  let regincl;

  if (exactMatchOnly) {
    regincl = new RegExp("^[" + filterin + "]+$", "i");
  } else {
    regincl = new RegExp(filterin, "i");
  }

  let filterout = modalEl
    .qsr<HTMLInputElement>(".wordExcludeInput")
    .getValue() as string;
  filterout = Misc.escapeRegExp(filterout.trim());
  filterout = filterout.replace(/\s+/gi, "|");
  const regexcl = new RegExp(filterout, "i");
  const filteredWords = [];

  const { data: languageWordList, error } = await tryCatch(
    JSONData.getLanguage(language),
  );
  if (error) {
    Notifications.add(
      Misc.createErrorMessage(error, "Failed to filter language words"),
      -1,
    );
    return [];
  }

  const maxLengthInput = modalEl
    .qsr<HTMLInputElement>(".wordMaxInput")
    .getValue() as string;
  const minLengthInput = modalEl
    .qsr<HTMLInputElement>(".wordMinInput")
    .getValue() as string;
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
    const test2 = exactMatchOnly ? false : regexcl.test(word);
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
  const language = modal
    .getModal()
    .qsr<HTMLSelectElement>("select.languageInput")
    .getValue() as Language;
  const filteredWords = await filter(language);

  if (filteredWords.length === 0) {
    Notifications.add("No words found", 0);
    enableButtons();
    return;
  }

  const customText = filteredWords.join(
    CustomText.getPipeDelimiter() ? "|" : " ",
  );

  hide({
    modalChainData: {
      text: customText,
      set,
    },
  });
}

function setExactMatchInput(disable: boolean): void {
  const wordExcludeInputEl = modal
    .getModal()
    .qsr<HTMLInputElement>("#wordExcludeInput");

  if (disable) {
    wordExcludeInputEl.setValue("");
    wordExcludeInputEl.disable();
  } else {
    wordExcludeInputEl.enable();
  }

  exactMatchCheckbox?.setChecked(disable);
}

function disableButtons(): void {
  modal.getModal().qsa("button").disable();
}

function enableButtons(): void {
  modal.getModal().qsa("button").enable();
}

async function setup(): Promise<void> {
  await initSelectOptions();

  const modalEl = modal.getModal();

  modalEl.qsr("button.generateButton").on("click", async () => {
    const presetName = modalEl
      .qsr<HTMLSelectElement>("select.presetInput")
      .getValue() as string;
    const layoutName = modalEl
      .qsr<HTMLSelectElement>("select.layoutInput")
      .getValue() as string;

    const presetToApply = presets[presetName];

    if (presetToApply === undefined) {
      Notifications.add(`Preset ${presetName} not found`, -1);
      return;
    }

    const layout = await JSONData.getLayout(layoutName);

    qsr<HTMLInputElement>("#wordIncludeInput").setValue(
      presetToApply
        .getIncludeString(layout)
        .map((x) => x[0])
        .join(" "),
    );

    if (presetToApply.exactMatch === true) {
      setExactMatchInput(true);
    } else {
      setExactMatchInput(false);
      if (presetToApply.getExcludeString !== undefined) {
        qsr<HTMLInputElement>("#wordExcludeInput").setValue(
          presetToApply
            .getExcludeString(layout)
            .map((x) => x[0])
            .join(" "),
        );
      }
    }
  });

  exactMatchCheckbox?.on("change", () => {
    setExactMatchInput(exactMatchCheckbox.isChecked() as boolean);
  });

  modalEl.qsr("button.addButton").on("click", () => {
    modalEl.qs(".loadingIndicator")?.show();
    disableButtons();
    setTimeout(() => {
      void apply(false);
    }, 0);
  });

  modalEl.qsr("button.setButton").on("click", () => {
    modalEl.qs(".loadingIndicator")?.show();
    disableButtons();
    setTimeout(() => {
      void apply(true);
    }, 0);
  });
}

async function cleanup(): Promise<void> {
  languageSelect?.destroy();
  layoutSelect?.destroy();
  presetSelect?.destroy();
  languageSelect = undefined;
  layoutSelect = undefined;
  presetSelect = undefined;
}

type OutgoingData = {
  text: string;
  set: boolean;
};

const modal = new AnimatedModal<unknown, OutgoingData>({
  dialogId: "wordFilterModal",
  setup,
  cleanup,
});
