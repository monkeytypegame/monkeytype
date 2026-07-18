import type { Language } from "@monkeytype/schemas/languages";
import type { LayoutObject } from "@monkeytype/schemas/layouts";

import { tryCatch } from "@monkeytype/util/trycatch";
import { createForm } from "@tanstack/solid-form";
import {
  createMemo,
  createResource,
  createSignal,
  JSXElement,
  Setter,
} from "solid-js";

import { Config } from "../../config/store";
import { LanguageList } from "../../constants/languages";
import { LayoutsList } from "../../constants/layouts";
import { createDebouncedSignal } from "../../hooks/createDebouncedSignal";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../states/notifications";
import * as BritishEnglish from "../../test/british-english";
import * as JSONData from "../../utils/json-data";
import * as Misc from "../../utils/misc";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Separator } from "../common/Separator";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
import { LabeledField } from "../ui/form/LabeledField";
import { SubmitButton } from "../ui/form/SubmitButton";
import SlimSelect from "../ui/SlimSelect";

type CustomTextIncomingData =
  | ({ set?: boolean; long?: boolean } & (
      | { text: string; splitText?: never }
      | { text?: never; splitText: string[] }
    ))
  | null;

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

type FilterFormValues = {
  include: string;
  exclude: string;
  minLength: string;
  maxLength: string;
  regex: string;
  exactMatch: boolean;
};

type FilterResult = { words: string[] } | { error: string };

export function filterWordList(
  value: FilterFormValues,
  words: string[],
  useBritishEnglish = false,
): FilterResult {
  const exactMatchOnly = value.exactMatch;

  // Source - https://stackoverflow.com/a/874742
  // Retrieved 2026-06-23, License - CC BY-SA 3.0
  // Separates string into regex expression
  let reglit = new RegExp("");
  try {
    const flags = value.regex.replace(/.*\/([gimy]*)$/, "$1");
    const pattern = value.regex.replace(new RegExp(`^/(.*?)/${flags}$`), "$1");
    reglit = new RegExp(pattern, flags);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: "Invalid Regex Expression" };
    }
    return { error: String(error) };
  }

  let filterin = Misc.escapeRegExp(value.include.trim());
  filterin = filterin.replace(/\s+/gi, "|");

  if (exactMatchOnly && filterin === "") {
    return { error: "Include field is required for exact match" };
  }
  const regincl = exactMatchOnly
    ? new RegExp(`^[${filterin}]+$`, "i")
    : new RegExp(filterin, "i");

  let filterout = Misc.escapeRegExp(value.exclude.trim());
  filterout = filterout.replace(/\s+/gi, "|");
  const regexcl = new RegExp(filterout, "i");

  const max = value.maxLength === "" ? 999 : parseInt(value.maxLength);
  const min = value.minLength === "" ? 1 : parseInt(value.minLength);

  const filteredWords: string[] = [];
  for (const word of words) {
    const wordToTest = useBritishEnglish
      ? BritishEnglish.replace(word, undefined)
      : word;
    const testincl = regincl.test(wordToTest);
    const testexcl =
      exactMatchOnly || filterout === "" ? false : regexcl.test(wordToTest);
    const testlit = exactMatchOnly ? true : reglit.test(wordToTest);
    if (
      testincl &&
      !testexcl &&
      testlit &&
      wordToTest.length <= max &&
      wordToTest.length >= min
    ) {
      filteredWords.push(word);
    }
  }
  return { words: filteredWords };
}

export function WordFilterModal(props: {
  setChainedData: Setter<CustomTextIncomingData>;
}): JSXElement {
  const [language, setLanguage] = createSignal(languageOptions[0]?.value ?? "");
  const [layout, setLayout] = createSignal(layoutOptions[0]?.value ?? "");
  const [preset, setPreset] = createSignal(presetOptions[0]?.value ?? "");
  const [loading, setLoading] = createSignal(false);

  let submitAction: "set" | "add" = "set";

  const useBritishEnglish = () =>
    Config.britishEnglish && Config.language.includes("english");

  const form = createForm(() => ({
    defaultValues: {
      include: "",
      exclude: "",
      minLength: "",
      maxLength: "",
      regex: "",
      exactMatch: false,
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      showLoaderBar();
      try {
        const { data: languageWordList, error } = await tryCatch(
          JSONData.getLanguage(language() as Language),
        );

        if (error) {
          showErrorNotification("Failed to filter language words", { error });
          return;
        }

        const result = filterWordList(
          value,
          languageWordList.words,
          useBritishEnglish(),
        );
        if ("error" in result) {
          showNoticeNotification(result.error);
          return;
        }

        if (result.words.length === 0) {
          showNoticeNotification("No words found");
          return;
        }
        props.setChainedData({
          splitText: result.words,
          set: submitAction === "set",
        });
        hideModal("WordFilter");
      } finally {
        hideLoaderBar();
        setLoading(false);
      }
    },
  }));

  const isExactMatch = form.useStore((s) => s.values.exactMatch);

  const [languageWords] = createResource(language, async (lang) => {
    const { data } = await tryCatch(JSONData.getLanguage(lang as Language));
    return data?.words ?? null;
  });

  const formValues = form.useStore((s) => s.values);

  // debounce the preview so it doesn't refilter the whole word list on every keystroke
  const debouncedValues = createDebouncedSignal(formValues, 250);

  const matchResult = createMemo<FilterResult | null>(() => {
    const words = languageWords();
    if (words === null || words === undefined) return null;
    return filterWordList(debouncedValues(), words, useBritishEnglish());
  });

  const applyPreset = async () => {
    const presetToApply = presets[preset()];
    if (presetToApply === undefined) {
      showErrorNotification(`Preset ${preset()} not found`);
      return;
    }

    const layoutData = await JSONData.getLayout(layout());
    form.setFieldValue(
      "include",
      presetToApply
        .getIncludeString(layoutData)
        .map((x) => x[0])
        .join(" "),
    );

    if (presetToApply.exactMatch === true) {
      form.setFieldValue("exactMatch", true);
      form.setFieldValue("exclude", "");
      form.setFieldValue("regex", "");
    } else {
      form.setFieldValue("exactMatch", false);
      if (presetToApply.getExcludeString !== undefined) {
        form.setFieldValue(
          "exclude",
          presetToApply
            .getExcludeString(layoutData)
            .map((x) => x[0])
            .join(" "),
        );
      }
    }
  };

  return (
    <AnimatedModal id="WordFilter" modalClass="max-w-[800px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <fieldset disabled={loading()} class="grid gap-4">
          <LabeledField label="language">
            <SlimSelect
              appendTo="container"
              options={languageOptions}
              selected={language()}
              onChange={setLanguage}
              disabled={loading()}
            />
          </LabeledField>
          <div class="text-xs text-sub">
            You can manually filter words by length, regular expressions, words,
            or characters (separated by spaces) on the left side. On the right
            side you can generate filters based on a preset and selected layout.
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div class="grid gap-4 self-start">
              <div class="grid grid-cols-2 gap-4">
                <LabeledField label="min length">
                  <form.Field name="minLength">
                    {(field) => <InputField field={field} type="number" />}
                  </form.Field>
                </LabeledField>
                <LabeledField label="max length">
                  <form.Field name="maxLength">
                    {(field) => <InputField field={field} type="number" />}
                  </form.Field>
                </LabeledField>
              </div>

              <LabeledField label="regex">
                <form.Field name="regex">
                  {(field) => (
                    <InputField field={field} disabled={isExactMatch()} />
                  )}
                </form.Field>
              </LabeledField>

              <LabeledField label="include">
                <form.Field name="include">
                  {(field) => <InputField field={field} />}
                </form.Field>
                <form.Field
                  name="exactMatch"
                  validators={{
                    onChange: ({ value }) => {
                      if (value) {
                        form.setFieldValue("exclude", "");
                        form.setFieldValue("regex", "");
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Checkbox
                      field={field}
                      label="Exact match only"
                      disabled={loading()}
                    />
                  )}
                </form.Field>
              </LabeledField>
              <LabeledField label="exclude">
                <form.Field name="exclude">
                  {(field) => (
                    <InputField field={field} disabled={isExactMatch()} />
                  )}
                </form.Field>
              </LabeledField>
            </div>

            <Separator vertical class="hidden md:block" />
            <Separator class="block md:hidden" />

            <div class="grid gap-4 self-start">
              <LabeledField label="presets">
                <SlimSelect
                  appendTo="container"
                  options={presetOptions}
                  selected={preset()}
                  onChange={setPreset}
                  disabled={loading()}
                />
              </LabeledField>
              <LabeledField label="layout">
                <SlimSelect
                  appendTo="container"
                  options={layoutOptions}
                  selected={layout()}
                  onChange={setLayout}
                  disabled={loading()}
                />
              </LabeledField>
              <Button
                variant="button"
                text="apply"
                disabled={loading()}
                onClick={() => void applyPreset()}
              />
            </div>
          </div>
          <div class="text-center text-xs text-sub">
            {(() => {
              const result = matchResult();
              if (result === null) return "loading words...";
              if ("error" in result) return result.error;
              return `${result.words.length} words found`;
            })()}
          </div>
          <div class="text-xs text-sub">
            {
              '"Set" replaces the current custom word list with the filter result, "Add" appends the filter result to the current custom word list.'
            }
          </div>
          <div class="grid gap-2">
            <SubmitButton
              form={form}
              variant="button"
              text="set"
              class="flex-1"
              skipUnchangedCheck
              disabled={loading()}
              onClick={() => (submitAction = "set")}
            />
            <SubmitButton
              form={form}
              variant="button"
              text="add"
              class="flex-1"
              skipUnchangedCheck
              disabled={loading()}
              onClick={() => (submitAction = "add")}
            />
          </div>
        </fieldset>
      </form>
    </AnimatedModal>
  );
}
