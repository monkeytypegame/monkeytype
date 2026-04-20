import { QuoteLength } from "@monkeytype/schemas/configs";
import {
  ResultFilters,
  ResultFiltersGroupItem,
  ResultFiltersKeys,
  ResultFiltersSchema,
} from "@monkeytype/schemas/users";
import { useLiveQuery } from "@tanstack/solid-db";
import { createSignal, createMemo, For, JSXElement, Show } from "solid-js";
import { SetStoreFunction, unwrap } from "solid-js/store";
import { z } from "zod";

import { resultFilterPresetsCollection } from "../../../collections/result-filter-presets";
import { type TagItem, useTagsLiveQuery } from "../../../collections/tags";
import { getConfig } from "../../../config/store";
import defaultResultFilters from "../../../constants/default-result-filters";
import { SimpleModal } from "../../../elements/simple-modal";
import { FaSolidIcon } from "../../../types/font-awesome";
import { IsValidResponse } from "../../../types/validation";
import {
  getLanguageDisplayString,
  normalizeName,
  replaceUnderscoresWithSpaces,
} from "../../../utils/strings";
import { AnimeShow } from "../../common/anime";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import { Separator } from "../../common/Separator";
import SlimSelect from "../../ui/SlimSelect";
import { verifyResultFiltersStructure } from "./utils";

const presetNameValidation = async (
  tagName: string,
): Promise<IsValidResponse> => {
  const validationResult = ResultFiltersSchema.shape.name.safeParse(
    normalizeName(tagName),
  );
  if (validationResult.success) return true;
  return validationResult.error.errors.map((err) => err.message).join(", ");
};
const newFilterPresetModal = new SimpleModal({
  id: "newFilterPresetModal",
  title: "New Filter Preset",
  inputs: [
    {
      placeholder: "Preset Name",
      type: "text",
      initVal: "",
      validation: {
        schema: z
          .string()
          .regex(/^[0-9a-zA-Z\ .-]+$/)
          .max(16),
        isValid: presetNameValidation,
        debounceDelay: 0,
      },
    },
  ],
  buttonText: "add",
  execFn: async (thisPopup, name) => {
    const filters = thisPopup.context as ResultFilters;

    try {
      const tx = resultFilterPresetsCollection.insert({
        ...structuredClone(filters),
        name: normalizeName(name),
      });
      await tx.isPersisted.promise;
      return { status: "success", message: "Filter preset created" };
    } catch (e) {
      let message: string = "Error creating filter preset";
      return { status: "error", message, alwaysHide: true };
    }
  },
});

export function Filters(props: {
  filters: ResultFilters;
  onChangeFilters: SetStoreFunction<ResultFilters>;
}): JSXElement {
  const FilterPresets = (props: {
    presets: ResultFilters[];
    onChangeFilters: SetStoreFunction<ResultFilters>;
  }): JSXElement => {
    return (
      <Show when={props.presets.length > 0}>
        <div>
          <H3 fa={{ icon: "fa-sliders-h" }} text="filter presets" />
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <For each={props.presets}>
              {(preset) => (
                <div class="flex w-full flex-row gap-2">
                  <Button
                    class="w-full"
                    text={replaceUnderscoresWithSpaces(preset.name)}
                    onClick={() =>
                      props.onChangeFilters(
                        verifyResultFiltersStructure(unwrap(preset)),
                      )
                    }
                  />
                  <Button
                    fa={{ icon: "fa-trash", fixedWidth: true }}
                    onClick={() =>
                      resultFilterPresetsCollection.delete(preset._id)
                    }
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    );
  };

  const Dropdown = <
    T extends ResultFiltersKeys,
    K extends keyof ResultFilters[T],
  >(options: {
    icon: FaSolidIcon;
    text: string;
    group: T;
    format?: (value: K) => string;
  }): JSXElement => {
    // Isolate this group's data to prevent unnecessary updates
    const groupData = createMemo(() => props.filters[options.group]);

    const dropdownOptions = createMemo(() =>
      Object.keys(groupData()).map((k) => ({
        value: k,
        text: options.format?.(k as K) ?? k,
      })),
    );

    const dropdownSelected = createMemo(() =>
      Object.entries(groupData())
        .filter(([, v]) => v)
        .map(([k]) => k),
    );

    return (
      <div>
        <H3 fa={{ icon: options.icon, fixedWidth: true }} text={options.text} />
        <SlimSelect
          multiple
          settings={{
            showSearch: true,
            placeholderText: "select a " + options.group,
            allowDeselect: true,
            closeOnSelect: false,
            maxValuesShown: 4,
            addAllOption: true,
            scrollToTop: true,
          }}
          onChange={(selectedValues) => {
            setFilter(
              options.group,
              Object.fromEntries(
                Object.entries(props.filters[options.group]).map(([k]) => [
                  k,
                  selectedValues.includes(k),
                ]),
              ),
            );
          }}
          options={dropdownOptions()}
          selected={dropdownSelected()}
        />
      </div>
    );
  };

  const ButtonGroup = <
    T extends ResultFiltersKeys,
    K extends keyof ResultFilters[T],
  >(options: {
    icon?: FaSolidIcon;
    text?: string;
    group: T;
    format?: (value: K) => string;
    classOverride?: string;
    singleSelect?: true;
  }): JSXElement => {
    const items = (): { id: K; text: string }[] =>
      Object.keys(props.filters[options.group]).map((id) => ({
        id,
        text: options.format?.(id as K) ?? new String(id).toString(),
      })) as { id: K; text: string }[];

    return (
      <div>
        <Show when={options.icon !== undefined && options.text !== undefined}>
          <H3
            fa={{ icon: options.icon as FaSolidIcon, fixedWidth: true }}
            text={options.text as string}
          />
        </Show>
        <div
          class={
            options.classOverride ??
            "flex justify-evenly gap-2 [&>button]:w-full [&>button]:last:col-span-2"
          }
        >
          <For each={items()}>
            {(item) => (
              <Button
                text={item.text ?? (item.id as string)}
                active={props.filters[options.group][item.id] === true}
                onClick={(e) => {
                  if (e.shiftKey || options.singleSelect) {
                    const newValue = Object.fromEntries(
                      Object.entries(props.filters[options.group]).map(
                        ([key]) => [key, key === item.id],
                      ),
                    );
                    setFilter(options.group, newValue);
                  } else {
                    setFilter(options.group, {
                      ...(props.filters[options.group] as Record<
                        string,
                        boolean
                      >),
                      // oxlint-disable-next-line typescript/strict-boolean-expressions
                      [item.id]: !props.filters[options.group][item.id],
                    });
                  }
                }}
              />
            )}
          </For>
        </div>
      </div>
    );
  };

  const tags = useTagsLiveQuery();
  const [isShowAdvanced, setShowAdvanced] = createSignal(false);

  const setFilter = (
    key: ResultFiltersKeys,
    value: Record<string, boolean>,
  ) => {
    props.onChangeFilters(key, value);
  };

  const presetsQuery = useLiveQuery((q) =>
    q.from({ presets: resultFilterPresetsCollection }),
  );

  return (
    <div class="flex flex-col gap-8">
      <AsyncContent collection={presetsQuery}>
        {(presets) => (
          <FilterPresets
            presets={presets}
            onChangeFilters={props.onChangeFilters}
          />
        )}
      </AsyncContent>
      <div>
        <H3 fa={{ icon: "fa-filter" }} text="filters" />
        <div class="mb-4 grid gap-4 sm:grid-cols-2 lg:flex lg:justify-evenly [&>button]:w-full">
          <Button
            text="all"
            onClick={() => props.onChangeFilters(defaultResultFilters)}
          />
          <Button
            text="current settings"
            onClick={() => props.onChangeFilters(fromCurrentSettings(tags()))}
          />
          <Button
            text="advanced"
            active={isShowAdvanced()}
            onClick={() => setShowAdvanced((old) => !old)}
          />
          <Button
            text="save as preset"
            onClick={() =>
              newFilterPresetModal.show(undefined, {
                context: { ...unwrap(props.filters), _id: "tmp" },
              })
            }
          />
        </div>
        <Separator class="mb-4 block lg:hidden" />
        <ButtonGroup
          singleSelect
          classOverride="grid gap-4 sm:grid-cols-2 lg:flex lg:justify-evenly [&>button]:w-full [&>button]:last:col-span-2"
          group="date"
          format={(val) => {
            if (val === "all") return "all time";
            if (val === "last_3months") return "last 3 months";
            return replaceUnderscoresWithSpaces(val);
          }}
        />

        <AnimeShow when={isShowAdvanced()} slide>
          <H3 fa={{ icon: "fa-tools" }} text="advanced filters" class="mt-8" />

          <Button
            text="clear filters"
            onClick={() => props.onChangeFilters(noFilters())}
            class="mb-4 w-full"
          />
          <div class="gap-4 md:grid md:grid-cols-2 [&>div]:last:col-span-2">
            <ButtonGroup text="difficulty" icon="fa-star" group="difficulty" />
            <ButtonGroup text="personal best" icon="fa-crown" group="pb" />
            <ButtonGroup text="mode" icon="fa-bars" group="mode" />
            <ButtonGroup
              text="quote length"
              icon="fa-quote-right"
              group="quoteLength"
            />
            <ButtonGroup text="words" icon="fa-font" group="words" />
            <ButtonGroup text="time" icon="fa-clock" group="time" />
            <ButtonGroup text="punctuation" icon="fa-at" group="punctuation" />
            <ButtonGroup text="numbers" icon="fa-hashtag" group="numbers" />

            <Dropdown
              icon="fa-tag"
              text="tags"
              group="tags"
              format={(tag) =>
                tag === "none"
                  ? "no tag"
                  : (tags().find((it) => it._id === tag)?.name ?? tag)
              }
            />
            <Dropdown
              icon="fa-gamepad"
              text="funbox"
              group="funbox"
              format={(val) =>
                val === "none" ? "no funbox" : replaceUnderscoresWithSpaces(val)
              }
            />
            <Dropdown
              icon="fa-globe-americas"
              text="language"
              group="language"
              format={getLanguageDisplayString}
            />
          </div>
        </AnimeShow>
      </div>
    </div>
  );
}

function noFilters(): ResultFilters {
  const filters = structuredClone(defaultResultFilters);
  Object.entries(filters)
    .filter(([key, value]) => key !== "date" && typeof value === "object")
    .map(([_, value]) => value as Record<string, boolean>)
    .forEach((group) =>
      Object.keys(group).forEach((it) => (group[it] = false)),
    );

  return filters;
}

function fromCurrentSettings(tags: TagItem[]): ResultFilters {
  const filters = noFilters();

  filters.pb.no = true;
  filters.pb.yes = true;

  filters.difficulty[getConfig.difficulty] = true;
  filters.mode[getConfig.mode] = true;
  if (getConfig.mode === "time") {
    if ([15, 30, 60, 120].includes(getConfig.time)) {
      const configTime = `${getConfig.time}` as keyof typeof filters.time;
      filters.time[configTime] = true;
    } else {
      filters.time.custom = true;
    }
  } else if (getConfig.mode === "words") {
    if ([10, 25, 50, 100, 200].includes(getConfig.words)) {
      const configWords = `${getConfig.words}` as keyof typeof filters.words;
      filters.words[configWords] = true;
    } else {
      filters.words.custom = true;
    }
  } else if (getConfig.mode === "quote") {
    const filterName: ResultFiltersGroupItem<"quoteLength">[] = [
      "short",
      "medium",
      "long",
      "thicc",
    ];
    filterName.forEach((ql, index) => {
      if (getConfig.quoteLength.includes(index as QuoteLength)) {
        filters.quoteLength[ql] = true;
      } else {
        filters.quoteLength[ql] = false;
      }
    });
  }
  if (getConfig.punctuation) {
    filters.punctuation.on = true;
  } else {
    filters.punctuation.off = true;
  }
  if (getConfig.numbers) {
    filters.numbers.on = true;
  } else {
    filters.numbers.off = true;
  }
  if (getConfig.mode === "quote" && /english.*/.test(getConfig.language)) {
    filters.language["english"] = true;
  } else {
    filters.language[getConfig.language] = true;
  }

  if (getConfig.funbox.length === 0) {
    filters.funbox["none"] = true;
  } else {
    for (const f of getConfig.funbox) {
      filters.funbox[f] = true;
    }
  }

  filters.tags["none"] = true;

  tags.forEach((tag) => {
    if (tag.active) {
      filters.tags["none"] = false;
      filters.tags[tag._id] = true;
    }
  });

  filters.date.all = true;

  return filters;
}
