import type { Language } from "@monkeytype/schemas/languages";
import type { LayoutObject } from "@monkeytype/schemas/layouts";

import { tryCatch } from "@monkeytype/util/trycatch";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement, Setter } from "solid-js";

import { LanguageList } from "../../constants/languages";
import { LayoutsList } from "../../constants/layouts";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../states/notifications";
import * as JSONData from "../../utils/json-data";
import * as Misc from "../../utils/misc";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Separator } from "../common/Separator";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
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

export function WordFilterModal(props: {
  setChainedData: Setter<CustomTextIncomingData>;
}): JSXElement {
  const [language, setLanguage] = createSignal(languageOptions[0]?.value ?? "");
  const [layout, setLayout] = createSignal(layoutOptions[0]?.value ?? "");
  const [preset, setPreset] = createSignal(presetOptions[0]?.value ?? "");
  const [loading, setLoading] = createSignal(false);

  let submitAction: "set" | "add" = "set";

  const form = createForm(() => ({
    defaultValues: {
      include: "",
      exclude: "",
      minLength: "",
      maxLength: "",
      exactMatch: false,
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      showLoaderBar();
      try {
        const exactMatchOnly = value.exactMatch;
        let filterin = Misc.escapeRegExp(value.include.trim());
        filterin = filterin.replace(/\s+/gi, "|");

        if (exactMatchOnly && filterin === "") {
          showNoticeNotification("Include field is required for exact match");
          return;
        }

        const regincl = exactMatchOnly
          ? new RegExp("^[" + filterin + "]+$", "i")
          : new RegExp(filterin, "i");

        let filterout = Misc.escapeRegExp(value.exclude.trim());
        filterout = filterout.replace(/\s+/gi, "|");
        const regexcl = new RegExp(filterout, "i");

        const { data: languageWordList, error } = await tryCatch(
          JSONData.getLanguage(language() as Language),
        );

        if (error) {
          showErrorNotification("Failed to filter language words", { error });
          return;
        }

        const max = value.maxLength === "" ? 999 : parseInt(value.maxLength);
        const min = value.minLength === "" ? 1 : parseInt(value.minLength);

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

        if (filteredWords.length === 0) {
          showNoticeNotification("No words found");
          return;
        }
        props.setChainedData({
          splitText: filteredWords,
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
          <div class="grid gap-1">
            <div class="text-sub">language</div>
            <SlimSelect
              options={languageOptions}
              selected={language()}
              onChange={setLanguage}
              disabled={loading()}
            />
          </div>
          <div class="text-xs text-sub">
            You can manually filter words by length, words or characters
            (separated by spaces) on the left side. On the right side you can
            generate filters based on a preset and selected layout.
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div class="grid gap-4 self-start">
              <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-1">
                  <div class="text-sub">min length</div>
                  <form.Field name="minLength">
                    {(field) => (
                      <InputField field={field} type="number" placeholder="" />
                    )}
                  </form.Field>
                </div>
                <div class="grid gap-1">
                  <div class="text-sub">max length</div>
                  <form.Field name="maxLength">
                    {(field) => (
                      <InputField field={field} type="number" placeholder="" />
                    )}
                  </form.Field>
                </div>
              </div>
              <div class="grid gap-1">
                <div class="text-sub">include</div>
                <form.Field name="include">
                  {(field) => <InputField field={field} placeholder="" />}
                </form.Field>
                <form.Field
                  name="exactMatch"
                  validators={{
                    onChange: ({ value }) => {
                      if (value) {
                        form.setFieldValue("exclude", "");
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
              </div>
              <div class="grid gap-1">
                <div class="text-sub">exclude</div>
                <form.Field name="exclude">
                  {(field) => (
                    <InputField
                      field={field}
                      disabled={isExactMatch()}
                      placeholder=""
                    />
                  )}
                </form.Field>
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
                  disabled={loading()}
                />
              </div>
              <div class="grid gap-1">
                <div class="text-sub">layout</div>
                <SlimSelect
                  options={layoutOptions}
                  selected={layout()}
                  onChange={setLayout}
                  disabled={loading()}
                />
              </div>
              <Button
                variant="button"
                text="apply"
                disabled={loading()}
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
            <SubmitButton
              form={form}
              variant="button"
              text="set"
              class="flex-1"
              skipDirtyCheck
              disabled={loading()}
              onClick={() => (submitAction = "set")}
            />
            <SubmitButton
              form={form}
              variant="button"
              text="add"
              class="flex-1"
              skipDirtyCheck
              disabled={loading()}
              onClick={() => (submitAction = "add")}
            />
          </div>
        </fieldset>
      </form>
    </AnimatedModal>
  );
}
