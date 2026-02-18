import { ResultFilters } from "@monkeytype/schemas/users";
import { createMemo, createSignal, For, JSXElement, Show } from "solid-js";

import { getSnapshot } from "../../../db";
import { FaSolidIcon } from "../../../types/font-awesome";
import { getLanguageDisplayString } from "../../../utils/strings";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import SlimSelect from "../../ui/SlimSelect";

const placeholder = (): void => {
  //
};

export function Filters(props: {
  filters: ResultFilters;
  onChangeFilter: (
    id: keyof ResultFilters,
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
        classOverride="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:justify-evenly [&>button]:w-full [&>button]:last:col-span-2"
        group="date"
        items={[
          { id: "last_day", text: "last day" },
          { id: "last_week", text: "last week" },
          { id: "last_month", text: "last month" },
          { id: "last_3months", text: "last 3 months" },
          { id: "all", text: "all time" },
        ]}
        onSelect={(id) => {
          const newValue = Object.fromEntries(
            Object.entries(props.filters.date).map(([key]) => [
              key,
              key === id,
            ]),
          );
          props.onChangeFilter("date", newValue);
        }}
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
              getSnapshot()?.tags.find((it) => it._id === tag)?.display ?? tag
            }
          />
          <Dropdown
            icon="fa-gamepad"
            text="funbox"
            group="funbox"
            format={(it) => it.replace(/_/g, " ")}
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
    T extends keyof ResultFilters,
    K extends keyof ResultFilters[T],
  >(options: {
    icon: FaSolidIcon;
    text: string;
    group: T;
    format?: (value: K) => string;
  }): JSXElement {
    const allSelected = createMemo(
      () =>
        Object.values(props.filters[options.group]).filter((it) => it === true)
          .length === Object.keys(props.filters[options.group]).length,
    );
    return (
      <div>
        <H3 fa={{ icon: options.icon, fixedWidth: true }} text={options.text} />
        <SlimSelect
          multiple
          onChange={(val) => {
            let selected = val as string[];
            props.onChangeFilter(
              options.group,
              Object.fromEntries(
                Object.entries(props.filters[options.group]).map(([k]) => [
                  k,
                  selected.includes(k),
                ]),
              ),
            );
          }}
          settings={{
            showSearch: true,
            placeholderText: "select a " + options.group,
            allowDeselect: true,
            closeOnSelect: false,
            scrollToTop: true,
          }}
          data={[
            { value: "all", text: "all", selected: allSelected() }, //TODO move to component
            ...Object.entries(props.filters[options.group]).map(([k, v]) => ({
              value: k,
              text: options.format?.(k as K) ?? k,
              filter: k,
              selected: v as boolean,
            })),
          ]}
        />
      </div>
    );
  }

  function ButtonGroup<
    T extends keyof ResultFilters,
    K extends keyof ResultFilters[T],
  >(options: {
    icon?: FaSolidIcon;
    text?: string;
    group: T;
    items?: { id: K; text?: string }[];
    onSelect?: (id: K) => void;
    classOverride?: string;
  }): JSXElement {
    const items = (): { id: K; text?: string }[] =>
      options.items ??
      (Object.keys(props.filters[options.group]).map((id) => ({
        id,
        text: new String(id).toString(),
      })) as { id: K; text?: string }[]);

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
                  if (options.onSelect !== undefined) {
                    options.onSelect(item.id);
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
