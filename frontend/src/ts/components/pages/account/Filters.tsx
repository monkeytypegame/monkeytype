import { ResultFilters } from "@monkeytype/schemas/users";
import { createSignal, For, JSXElement, Show } from "solid-js";

import { FaSolidIcon } from "../../../types/font-awesome";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";

const placeholder = (): void => {
  //
};

export function Filters(props: {
  filters: ResultFilters;
  onChangeFilter: (id: keyof ResultFilters, value: object) => void;
}): JSXElement {
  const [isShowAdvanced, setShowAdvanced] = createSignal(true);

  return (
    <>
      <H3 fa={{ icon: "fa-filter" }} text="filters" />
      <div>
        <Button text="all" onClick={placeholder} />
        <Button text="current settings" onClick={placeholder} />
        <Button
          text="advanced"
          active={isShowAdvanced()}
          onClick={() => setShowAdvanced((old) => !old)}
        />
        <Button text="save as preset" onClick={placeholder} />
      </div>

      <ButtonGroup
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
        <H3 fa={{ icon: "fa-tools" }} text="advanced filters" />
        <Button text="clear filters" onClick={placeholder} />

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
      </Show>
    </>
  );

  function ButtonGroup<
    T extends keyof ResultFilters,
    K extends keyof ResultFilters[T],
  >(options: {
    icon?: FaSolidIcon;
    text?: string;
    group: T;
    items?: { id: K; text?: string }[];
    onSelect?: (id: K) => void;
  }): JSXElement {
    const items = (): { id: K; text?: string }[] =>
      options.items ??
      (Object.keys(props.filters[options.group]).map((id) => ({
        id,
        text: new String(id).toString(),
      })) as { id: K; text?: string }[]);

    return (
      <>
        <Show when={options.icon !== undefined && options.text !== undefined}>
          <H3
            fa={{ icon: options.icon as FaSolidIcon, fixedWidth: true }}
            text={options.text as string}
          />
        </Show>
        <div>
          <For each={items()}>
            {(item) => (
              <Button
                text={item.text ?? (item.id as string)}
                active={props.filters[options.group][item.id] === true}
                onClick={() => {
                  if (options.onSelect !== undefined) {
                    options.onSelect(item.id);
                  } else {
                    // oxlint-disable-next-line typescript/no-explicit-any typescript/no-unsafe-return
                    props.onChangeFilter(options.group, (old: any) => ({
                      ...old,
                      // oxlint-disable-next-line typescript/strict-boolean-expressions typescript/no-unsafe-member-access
                      [item.id]: !old[item.id],
                    }));
                  }
                }}
              />
            )}
          </For>
        </div>
      </>
    );
  }
}
