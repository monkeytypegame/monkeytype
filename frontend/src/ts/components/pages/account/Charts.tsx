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
import {
  capitalizeFirstLetter,
  replaceUnderscoresWithSpaces,
} from "../../../utils/strings";
import { get as getTypingSpeedUnit } from "../../../utils/typing-speed-units";
import AsyncContent from "../../common/AsyncContent";
import { ChartJs } from "../../common/ChartJs";
import { Fa } from "../../common/Fa";

export function Charts(props: {
  filters: ResultFilters;
  queryState: ResultsQueryState | undefined;
}): JSXElement {
  return (
    <>
      <FilterSummary filters={props.filters} />
      <HistoryChart queryState={props.queryState} />
    </>
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

function HistoryChart(props: {
  queryState: ResultsQueryState | undefined;
}): JSXElement {
  const beginAtZero = createMemo(() => getConfig.startGraphsAtZero);
  const typingSpeedUnit = createMemo(() =>
    getTypingSpeedUnit(getConfig.typingSpeedUnit),
  );

  const resultsQuery = useLiveQuery((q) => {
    if (props.queryState === undefined) return undefined;
    return q
      .from({ r: buildResultsQuery(props.queryState) })
      .orderBy(({ r }) => r.timestamp, "desc");
  });

  return (
    <AsyncContent collection={resultsQuery}>
      {(results) => {
        const wpm = results.map((it) => typingSpeedUnit().fromWpm(it.wpm));
        const acc = results.map((it) => it.acc);
        return (
          <div style={{ height: "400px" }}>
            <ChartJs
              type="line"
              data={{
                labels: results.map((_, i) => i),
                datasets: [
                  {
                    yAxisID: "wpm",
                    data: wpm,
                    fill: false,
                    borderWidth: 0,
                    order: 3,
                  },
                  {
                    yAxisID: "wpm",
                    data: pb(wpm),
                    fill: false,
                    stepped: true,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 4,
                  },
                  {
                    yAxisID: "acc",
                    fill: false,
                    data: acc,
                    pointStyle: "triangle",
                    borderWidth: 0,
                    pointRadius: 3.5,
                    order: 3,
                  },
                  {
                    yAxisID: "wpm",
                    data: movingAverage(wpm, 10),
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 2,
                  },
                  {
                    yAxisID: "acc",
                    data: movingAverage(acc, 10),
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 2,
                  },
                  {
                    yAxisID: "wpm",
                    data: movingAverage(wpm, 100),
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 1,
                  },
                  {
                    yAxisID: "acc",
                    data: movingAverage(acc, 100),
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 1,
                  },
                ],
              }}
              options={{
                // responsive: true,
                maintainAspectRatio: false,
                hover: {
                  mode: "nearest",
                  intersect: false,
                },
                scales: {
                  x: {
                    axis: "x",
                    type: "linear",
                    reverse: true,
                    min: 0,
                    ticks: {
                      stepSize: 10,
                    },
                    display: false,
                    grid: {
                      display: false,
                    },
                  },
                  wpm: {
                    axis: "y",
                    type: "linear",
                    beginAtZero: beginAtZero(),
                    ticks: {
                      stepSize: typingSpeedUnit().historyStepSize,
                    },
                    display: true,
                    title: {
                      display: true,
                      text: typingSpeedUnit().fullUnitString,
                    },
                    position: "right",
                  },
                  acc: {
                    axis: "y",
                    beginAtZero: beginAtZero(),
                    min: 0,
                    max: 100,
                    reverse: true,
                    ticks: {
                      stepSize: 10,
                    },
                    display: true,
                    title: {
                      display: true,
                      text: "Accuracy",
                    },
                    grid: {
                      display: false,
                    },
                    position: "left",
                  },
                },

                plugins: {
                  annotation: {
                    annotations: [],
                  },
                  tooltip: {
                    animation: { duration: 250 },
                    // Disable the on-canvas tooltip
                    enabled: true,

                    intersect: false,
                    external: function (ctx): void {
                      if (ctx === undefined) return;
                      ctx.tooltip.options.displayColors = false;
                    },
                    filter: function (tooltipItem): boolean {
                      return (
                        tooltipItem.datasetIndex !== 1 &&
                        tooltipItem.datasetIndex !== 3 &&
                        tooltipItem.datasetIndex !== 4 &&
                        tooltipItem.datasetIndex !== 5 &&
                        tooltipItem.datasetIndex !== 6
                      );
                    },
                    callbacks: {
                      title: function (): string {
                        return "";
                      },
                      /*
                beforeLabel: function (tooltipItem): string {
                  if (tooltipItem.datasetIndex !== 0) {
                    const resultData = tooltipItem.dataset.data[
                      tooltipItem.dataIndex
                    ] as AccChartData;
                    return `error rate: ${Numbers.roundTo2(
                      resultData.errorRate,
                    )}%\nacc: ${Numbers.roundTo2(100 - resultData.errorRate)}%`;
                  }
                  const resultData = tooltipItem.dataset.data[
                    tooltipItem.dataIndex
                  ] as HistoryChartData;
                  let label =
                    `${Config.typingSpeedUnit}: ${resultData.wpm}` +
                    "\n" +
                    `raw: ${resultData.raw}` +
                    "\n" +
                    `acc: ${resultData.acc}` +
                    "\n\n" +
                    `mode: ${resultData.mode} `;

                  if (resultData.mode === "time") {
                    label += resultData.mode2;
                  } else if (resultData.mode === "words") {
                    label += resultData.mode2;
                  }

                  let diff = resultData.difficulty ?? "normal";
                  label += `\ndifficulty: ${diff}`;

                  label +=
                    "\n" +
                    `punctuation: ${resultData.punctuation}` +
                    "\n" +
                    `language: ${resultData.language}` +
                    `${resultData.isPb ? "\n\nnew personal best" : ""}` +
                    "\n\n" +
                    `date: ${format(
                      new Date(resultData.timestamp),
                      "dd MMM yyyy HH:mm",
                    )}`;

                  return label;
                },

                label: function (): string {
                  return "";
                },
                afterLabel: function (tooltip): string {
                  accountHistoryActiveIndex = tooltip.dataIndex;
                  return "";
                },
                                */
                    },
                  },
                },
              }}
            />
          </div>
        );
      }}
    </AsyncContent>
  );
}

function movingAverage(data: number[], windowSize: number): number[] {
  return data.map((_, i, array) => {
    const subset = array.slice(i, i + windowSize);

    if (subset.length === 0) return 0;

    const sum = subset.reduce((acc, value) => acc + value, 0);

    return sum / subset.length;
  });
}

function pb(data: number[]): number[] {
  const result = new Array<number>(data.length);
  let currentMax: number = -Infinity;

  for (let i = data.length - 1; i >= 0; i--) {
    const value = Number(data[i]);

    if (Number.isFinite(value)) {
      currentMax = Math.max(currentMax, value);
    }

    result[i] = currentMax;
  }

  return result;
}
