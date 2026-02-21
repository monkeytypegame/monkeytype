import { ResultFilters, ResultFiltersKeys } from "@monkeytype/schemas/users";
import { useLiveQuery } from "@tanstack/solid-db";
import { createMemo, JSXElement } from "solid-js";

import {
  buildResultsQuery,
  ResultsQueryState,
} from "../../../collections/results";
import { getSnapshot } from "../../../db";
import { getConfig } from "../../../signals/config";
import { FaSolidIcon } from "../../../types/font-awesome";
import { Formatting } from "../../../utils/format";
import {
  capitalizeFirstLetter,
  replaceUnderscoresWithSpaces,
} from "../../../utils/strings";
import { get as getTypingSpeedUnit } from "../../../utils/typing-speed-units";
import AsyncContent from "../../common/AsyncContent";
import { Fa } from "../../common/Fa";

import { HistoryChart } from "./HistoryChart";

export function Charts(props: {
  filters: ResultFilters;
  queryState: ResultsQueryState | undefined;
}): JSXElement {
  const beginAtZero = createMemo(() => getConfig.startGraphsAtZero);
  const typingSpeedUnit = createMemo(() =>
    getTypingSpeedUnit(getConfig.typingSpeedUnit),
  );
  const format = createMemo(() => new Formatting(getConfig));

  const resultsQuery = useLiveQuery((q) => {
    if (props.queryState === undefined) return undefined;
    return q
      .from({ r: buildResultsQuery(props.queryState) })
      .orderBy(({ r }) => r.timestamp, "desc");
  });

  return (
    <AsyncContent collection={resultsQuery}>
      {(results) => (
        <>
          <FilterSummary filters={props.filters} />
          <HistoryChart
            results={results}
            beginAtZero={beginAtZero()}
            typingSpeedUnit={typingSpeedUnit()}
            format={format()}
          />
        </>
      )}
    </AsyncContent>
  );
}

function FilterSummary(props: { filters: ResultFilters }): JSXElement {
  return (
    <div class="mt-4 mb-4 flex flex-wrap justify-center gap-4 text-sub [&>span>i]:mr-1">
      <Item
        group="date"
        icon="fa-calendar"
        format={replaceUnderscoresWithSpaces}
      />
      <Item group="mode" icon="fa-bars" />
      <Item group="time" icon="fa-clock" />
      <Item group="words" icon="fa-font" />
      <Item group="difficulty" icon="fa-star" />
      <Item group="punctuation" icon="fa-at" />
      <Item group="numbers" icon="fa-hashtag" />
      <Item group="language" icon="fa-globe-americas" />
      <Item
        group="funbox"
        icon="fa-gamepad"
        format={replaceUnderscoresWithSpaces}
      />
      <Item
        group="tags"
        icon="fa-tags"
        format={(tag) =>
          getSnapshot()?.tags.find((it) => it._id === tag)?.display ?? tag
        }
      />
    </div>
  );

  function Item<
    T extends ResultFiltersKeys,
    K extends keyof ResultFilters[T],
  >(options: {
    group: T;
    icon: FaSolidIcon;
    format?: (val: K) => string;
  }): JSXElement {
    const values = createMemo(() =>
      isAllSet(props.filters[options.group])
        ? "all"
        : Object.entries(props.filters[options.group])
            .filter(([_, v]) => v)
            .map(([it]) => options.format?.(it as K) ?? it)
            .join(", "),
    );

    return (
      <span
        aria-label={capitalizeFirstLetter(options.group)}
        data-balloon-pos="up"
      >
        <Fa icon={options.icon} fixedWidth />
        {values()}
      </span>
    );
  }
}

function isAllSet(
  filter: Record<string | number | symbol, boolean | undefined>,
): boolean {
  return Object.values(filter).every((value) => value);
}
