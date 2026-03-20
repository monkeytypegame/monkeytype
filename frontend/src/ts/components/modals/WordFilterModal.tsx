import type { Language } from "@monkeytype/schemas/languages";
import type { LayoutObject } from "@monkeytype/schemas/layouts";

import { tryCatch } from "@monkeytype/util/trycatch";
import { createSignal, JSXElement, Setter } from "solid-js";

import type { CustomTextIncomingData } from "./CustomTextModal";

import { LanguageList } from "../../constants/languages";
import { LayoutsList } from "../../constants/layouts";
import { hideModal } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../states/notifications";
import * as CustomText from "../../test/custom-text";
import * as JSONData from "../../utils/json-data";
import * as Misc from "../../utils/misc";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Separator } from "../common/Separator";
import SlimSelect from "../ui/SlimSelect";

type FilterPreset = {
  display: string;
  getIncludeString: (layout: LayoutObject) => string[][];
} & (
  | { exactMatch: true }
  | {
      exactMatch?: false;
      getExcludeString?: (layout: LayoutObject) => string[][];
    }
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
    getIncludeString: (layout) => layout.keys.row3,
    exactMatch: true,
  },
  topRow: {
    display: "top row",
    getIncludeString: (layout) => layout.keys.row2,
    exactMatch: true,
  },
  bottomRow: {
    display: "bottom row",
    getIncludeString: (layout) => layout.keys.row4,
    exactMatch: true,
  },
};

const languageOptions = LanguageList.map((lang) => ({
  value: lang,
  text: lang.replace(/_/gi, " "),
}));

const layoutOptions = LayoutsList.map((layout) => ({
  value: layout,
  text: layout.replace(/_/gi, " "),
}));

const presetOptions = Object.entries(presets).map(([id, preset]) => ({
  value: id,
  text: preset.display,
}));

export function WordFilterModal(props: {
  setIncomingData: Setter<CustomTextIncomingData>;
}): JSXElement {
  const [language, setLanguage] = createSignal(languageOptions[0]?.value ?? "");
  const [layout, setLayout] = createSignal(layoutOptions[0]?.value ?? "");
  const [preset, setPreset] = createSignal(presetOptions[0]?.value ?? "");
  const [includeInput, setIncludeInput] = createSignal("");
  const [excludeInput, setExcludeInput] = createSignal("");
  const [minLength, setMinLength] = createSignal("");
  const [maxLength, setMaxLength] = createSignal("");
  const [exactMatch, setExactMatch] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const applyPreset = async () => {
    const presetToApply = presets[preset()];
    if (presetToApply === undefined) {
      showErrorNotification(`Preset ${preset()} not found`);
      return;
    }

    const layoutData = await JSONData.getLayout(layout());
    setIncludeInput(
      presetToApply
        .getIncludeString(layoutData)
        .map((x) => x[0])
        .join(" "),
    );

    if (presetToApply.exactMatch === true) {
      setExactMatch(true);
      setExcludeInput("");
    } else {
      setExactMatch(false);
      if (presetToApply.getExcludeString !== undefined) {
        setExcludeInput(
          presetToApply
            .getExcludeString(layoutData)
            .map((x) => x[0])
            .join(" "),
        );
      }
    }
  };

  const filter = async (): Promise<string[]> => {
    const exactMatchOnly = exactMatch();
    let filterin = Misc.escapeRegExp(includeInput().trim());
    filterin = filterin.replace(/\s+/gi, "|");
    const regincl = exactMatchOnly
      ? new RegExp("^[" + filterin + "]+$", "i")
      : new RegExp(filterin, "i");

    let filterout = Misc.escapeRegExp(excludeInput().trim());
    filterout = filterout.replace(/\s+/gi, "|");
    const regexcl = new RegExp(filterout, "i");

    const { data: languageWordList, error } = await tryCatch(
      JSONData.getLanguage(language() as Language),
    );

    if (error) {
      showErrorNotification("Failed to filter language words", { error });
      return [];
    }

    const max = maxLength() === "" ? 999 : parseInt(maxLength());
    const min = minLength() === "" ? 1 : parseInt(minLength());

    const filteredWords: string[] = [];
    for (const word of languageWordList.words) {
      const test1 = regincl.test(word);
      const test2 = exactMatchOnly ? false : regexcl.test(word);
      if (
        ((test1 && !test2) || (test1 && filterout === "")) &&
        word.length <= max &&
        word.length >= min
      ) {
        filteredWords.push(word);
      }
    }
    return filteredWords;
  };

  const apply = async (set: boolean) => {
    setLoading(true);
    try {
      const filteredWords = await filter();
      if (filteredWords.length === 0) {
        showNoticeNotification("No words found");
        return;
      }
      const customText = filteredWords.join(
        CustomText.getPipeDelimiter() ? "|" : " ",
      );
      props.setIncomingData({ text: customText, set });
      hideModal("WordFilter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedModal id="WordFilter" modalClass="max-w-[800px] grid gap-4">
      <div class="grid gap-1">
        <div class="text-sub">language</div>
        <SlimSelect
          options={languageOptions}
          selected={language()}
          onChange={setLanguage}
        />
      </div>
      <div class="text-xs text-sub">
        You can manually filter words by length, words or characters (separated
        by spaces) on the left side. On the right side you can generate filters
        based on a preset and selected layout.
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div class="grid gap-4 self-start">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-1">
              <div class="text-sub">min length</div>
              <input
                type="number"
                class="w-full"
                autocomplete="off"
                value={minLength()}
                onInput={(e) => setMinLength(e.currentTarget.value)}
              />
            </div>
            <div class="grid gap-1">
              <div class="text-sub">max length</div>
              <input
                type="number"
                class="w-full"
                autocomplete="off"
                value={maxLength()}
                onInput={(e) => setMaxLength(e.currentTarget.value)}
              />
            </div>
          </div>
          <div class="grid gap-1">
            <div class="text-sub">include</div>
            <input
              class="w-full"
              autocomplete="off"
              value={includeInput()}
              onInput={(e) => setIncludeInput(e.currentTarget.value)}
            />
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="w-[1.25em]"
                checked={exactMatch()}
                onChange={(e) => {
                  setExactMatch(e.currentTarget.checked);
                  if (e.currentTarget.checked) setExcludeInput("");
                }}
              />
              Exact match only
            </label>
          </div>
          <div class="grid gap-1">
            <div class="text-sub">exclude</div>
            <input
              class="w-full"
              autocomplete="off"
              value={excludeInput()}
              disabled={exactMatch()}
              onInput={(e) => setExcludeInput(e.currentTarget.value)}
            />
          </div>
        </div>

        <Separator vertical class="hidden md:block" />
        <Separator class="block md:hidden" />

        <div class="grid gap-4 self-start">
          <div class="grid gap-1">
            <div class="text-sub">presets</div>
            <SlimSelect
              options={presetOptions}
              selected={preset()}
              onChange={setPreset}
            />
          </div>
          <div class="grid gap-1">
            <div class="text-sub">layout</div>
            <SlimSelect
              options={layoutOptions}
              selected={layout()}
              onChange={setLayout}
            />
          </div>
          <Button
            variant="button"
            text="apply"
            onClick={() => void applyPreset()}
          />
        </div>
      </div>

      <div class="text-xs text-sub">
        {
          '"Set" replaces the current custom word list with the filter result, "Add" appends the filter result to the current custom word list.'
        }
      </div>
      <div class="grid gap-2">
        <Button
          variant="button"
          text="set"
          class="flex-1"
          disabled={loading()}
          onClick={() => void apply(true)}
        />
        <Button
          variant="button"
          text="add"
          class="flex-1"
          disabled={loading()}
          onClick={() => void apply(false)}
        />
      </div>
    </AnimatedModal>
  );
}
