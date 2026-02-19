import { ResultFilters, ResultFiltersKeys } from "@monkeytype/schemas/users";
import { createSignal, createMemo, For, JSXElement, Show } from "solid-js";

import { getSnapshot } from "../../../db";
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
  onChangeFilter: (
    id: ResultFiltersKeys,
    value: Record<string, boolean>,
  ) => void;
  onResetFilter: () => void;
}): JSXElement {
  const [isShowAdvanced, setShowAdvanced] = createSignal(true);

  return (
    <>
      <H3 fa={{ icon: "fa-filter" }} text="filters" />
      <div class="mb-12 grid gap-4 sm:grid-cols-2 lg:mb-4 lg:flex lg:justify-evenly [&>button]:w-full">
        <Button text="all" onClick={() => props.onResetFilter()} />
        <Button text="current settings" onClick={placeholder} />
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
          onClick={placeholder}
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
            props.onChangeFilter(
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
                    props.onChangeFilter(options.group, newValue);
                  } else {
                    props.onChangeFilter(options.group, {
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
