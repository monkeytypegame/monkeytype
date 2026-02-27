import { QuoteLength } from "@monkeytype/schemas/configs";
import {
  ResultFilters,
  ResultFiltersGroupItem,
  ResultFiltersKeys,
} from "@monkeytype/schemas/users";
import { createSignal, createMemo, For, JSXElement, Show } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

import defaultResultFilters from "../../../constants/default-result-filters";
import { getSnapshot } from "../../../db";
import { getConfig } from "../../../signals/config";
import { FaSolidIcon } from "../../../types/font-awesome";
import {
  getLanguageDisplayString,
  replaceUnderscoresWithSpaces,
} from "../../../utils/strings";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import SlimSelect from "../../ui/SlimSelect";

const placeholder = (): void => {
  //
};

export function Filters(props: {
  filters: ResultFilters;
  onChangeFilters: SetStoreFunction<ResultFilters>;
}): JSXElement {
  const [isShowAdvanced, setShowAdvanced] = createSignal(true);

  const setFilter = (
    key: ResultFiltersKeys,
    value: Record<string, boolean>,
  ) => {
    props.onChangeFilters(key, value);
  };

  return (
    <>
      <H3 fa={{ icon: "fa-filter" }} text="filters" />
      <div class="mb-12 grid gap-4 sm:grid-cols-2 lg:mb-4 lg:flex lg:justify-evenly [&>button]:w-full">
        <Button
          text="all"
          onClick={() => props.onChangeFilters(defaultResultFilters)}
        />
        <Button
          text="current settings"
          onClick={() => props.onChangeFilters(fromCurrentSettings())}
        />
        <Button
          text="advanced"
          active={isShowAdvanced()}
          onClick={() => setShowAdvanced((old) => !old)}
        />
        <Button text="save as preset" onClick={placeholder} />
      </div>

      <ButtonGroup
        singleSelect
        classOverride="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:justify-evenly [&>button]:w-full [&>button]:last:col-span-2"
        group="date"
        format={(val) =>
          val === "last_3months"
            ? "last 3 months"
            : replaceUnderscoresWithSpaces(val)
        }
      />

      <Show when={isShowAdvanced()}>
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
                : (getSnapshot()?.tags.find((it) => it._id === tag)?.display ??
                  tag)
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
      </Show>
    </>
  );
  function Dropdown<
    T extends ResultFiltersKeys,
    K extends keyof ResultFilters[T],
  >(options: {
    icon: FaSolidIcon;
    text: string;
    group: T;
    format?: (value: K) => string;
  }): JSXElement {
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
  }

  function ButtonGroup<
    T extends ResultFiltersKeys,
    K extends keyof ResultFilters[T],
  >(options: {
    icon?: FaSolidIcon;
    text?: string;
    group: T;
    format?: (value: K) => string;
    classOverride?: string;
    singleSelect?: true;
  }): JSXElement {
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
                onClick={() => {
                  if (options.singleSelect) {
                    const newValue = Object.fromEntries(
                      Object.entries(props.filters.date).map(([key]) => [
                        key,
                        key === item.id,
                      ]),
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
  }
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

function fromCurrentSettings(): ResultFilters {
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

  getSnapshot()?.tags?.forEach((tag) => {
    if (tag.active === true) {
      filters.tags["none"] = false;
      filters.tags[tag._id] = true;
    }
  });

  filters.date.all = true;

  return filters;
}
