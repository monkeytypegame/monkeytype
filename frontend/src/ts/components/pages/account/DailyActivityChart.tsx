import { TypingSpeedUnit } from "@monkeytype/schemas/configs";
import { roundTo2 } from "@monkeytype/util/numbers";
import {
  barY,
  defineChart,
  dot,
  lineY,
  linearRegressionY,
  type ChartTooltipRow,
} from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scaleUtc } from "@tanstack/charts/scales/time";
import { Chart } from "@tanstack/charts/solid";
import { tooltip } from "@tanstack/charts/tooltip";
import { TooltipItem } from "chart.js";
import { format as dateFormat } from "date-fns/format";
import { Accessor, createMemo, JSXElement, Show } from "solid-js";

import {
  ResultsQueryState,
  useResultStatsLiveQuery,
} from "../../../collections/results";
import { getConfig } from "../../../config/store";
import { Theme } from "../../../constants/themes";
import { getUseTanstackCharts } from "../../../dev/chart-parity";
import { getTheme } from "../../../theme/state";
import { secondsToString } from "../../../utils/date-and-time";
import {
  formatAccuracy,
  formatPercentage,
  formatTypingSpeed,
} from "../../../utils/format";
import { TypingSpeedUnitSettings } from "../../../utils/typing-speed-units";
import AsyncContent from "../../common/AsyncContent";
import { ChartJs } from "../../common/ChartJs";

/**
 * One day of the daily activity chart: the result stats grouped by day,
 * with minutes (the bar channel) precomputed.
 */
export type DailyActivityDay = {
  dayTimestamp: number;
  /** seconds */
  timeTyping: number;
  completed: number;
  restarted: number;
  maxWpm: number;
  avgWpm: number;
  avgAcc: number;
  avgConsistency: number;
};

/**
 * The account page daily activity chart: minutes typed per day (bars, left
 * axis) and average speed per day (line, right axis), with the trendline the
 * old chartjs-plugin-trendline drew over the bars. Renders the Chart.js half
 * by default; the dev-only parity flag (dev/chart-parity) switches to the
 * TanStack implementation.
 */
export function DailyActivityChart(props: {
  queryState: Accessor<ResultsQueryState | undefined>;
  beginAtZero: boolean;
  typingSpeedUnit: TypingSpeedUnitSettings;
}): JSXElement {
  const dataQuery = useResultStatsLiveQuery(() => props.queryState(), {
    groupByDay: true,
  });

  const days = createMemo<DailyActivityDay[]>(() =>
    (dataQuery() ?? []).map((it) => ({
      dayTimestamp: it.dayTimestamp ?? 0,
      timeTyping: it.timeTyping ?? 0,
      completed: it.completed ?? 0,
      restarted: it.restarted ?? 0,
      maxWpm: it.maxWpm ?? 0,
      avgWpm: it.avgWpm ?? 0,
      avgAcc: it.avgAcc ?? 0,
      avgConsistency: it.avgConsistency ?? 0,
    })),
  );

  const definition = createMemo(() =>
    buildDailyActivityChartDefinition(
      days(),
      getTheme,
      props.beginAtZero,
      getConfig.typingSpeedUnit,
      props.typingSpeedUnit,
    ),
  );

  const formatSpeed = (wpm: number): string =>
    formatTypingSpeed(wpm, { showDecimalPlaces: true });

  return (
    <AsyncContent collections={{ dataQuery }}>
      {({ dataQueryData }) => (
        <div class="h-50">
          <Show
            when={getUseTanstackCharts()}
            fallback={
              // Stepping stone: replaced by the TanStack implementation; removed in S12
              <ChartJs
                name="DailyActivity"
                type="bar"
                data={{
                  labels: dataQueryData().map((it) => it.dayTimestamp),
                  datasets: [
                    {
                      yAxisID: "count",
                      data: dataQueryData().map((it) => it.timeTyping / 60),
                      backgroundColor: getTheme().main,
                      trendlineLinear: {
                        lineStyle: "dotted",
                        width: 2,
                        //@ts-expect-error colorMin and colorMax missing from the type definition
                        colorMin: getTheme().sub,
                        colorMax: getTheme().sub,
                      },
                      order: 3,
                    },
                    {
                      yAxisID: "avgWpm",
                      data: dataQueryData().map((it) =>
                        props.typingSpeedUnit.fromWpm(it.avgWpm),
                      ),
                      borderColor: getTheme().sub,
                      pointBackgroundColor: getTheme().sub,
                      type: "line",
                      order: 2,
                      tension: 0,
                      fill: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  hover: {
                    mode: "nearest",
                    intersect: false,
                  },
                  scales: {
                    x: {
                      axis: "x",
                      ticks: {
                        autoSkip: true,
                        autoSkipPadding: 20,
                      },
                      type: "time",
                      time: {
                        unit: "day",
                        displayFormats: {
                          day: "d MMM",
                        },
                      },
                      bounds: "ticks",
                      display: true,
                      title: {
                        display: false,
                        text: "Date",
                      },
                      offset: true,
                    },
                    count: {
                      axis: "y",
                      beginAtZero: true,
                      min: 0,
                      ticks: {
                        autoSkip: true,
                        autoSkipPadding: 20,
                        stepSize: 1,
                      },
                      display: true,
                      title: {
                        display: true,
                        text: "Time typing (minutes)",
                      },
                      grid: { display: false },
                    },
                    avgWpm: {
                      axis: "y",
                      beginAtZero: props.beginAtZero,
                      ticks: {
                        autoSkip: true,
                        autoSkipPadding: 20,
                        stepSize: 10,
                      },
                      display: true,
                      position: "right",
                      title: {
                        display: true,
                        text: `Average ${getConfig.typingSpeedUnit.toUpperCase()}`,
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                  plugins: {
                    annotation: {
                      annotations: [],
                    },
                    tooltip: {
                      animation: { duration: 250 },
                      intersect: false,
                      mode: "index",
                      filter: (tooltipItem): boolean => {
                        return tooltipItem.datasetIndex === 0;
                      },

                      callbacks: {
                        title: function (tooltipItem): string {
                          const firstItem = tooltipItem[0] as TooltipItem<
                            "bar" | "line"
                          >;

                          const item = dataQueryData()[firstItem.dataIndex];
                          if (item === undefined) return "unknown";

                          return dateFormat(
                            new Date(item.dayTimestamp as number),
                            "dd MMM yyyy",
                          );
                        },
                        beforeLabel: function (tooltipItem): string {
                          const item = dataQueryData()[tooltipItem.dataIndex];
                          if (item === undefined) return "unknown";

                          return `
Time Typing: ${secondsToString(Math.round(item.timeTyping), true, true)}
Tests Completed: ${item.completed}
Restarts per test: ${roundTo2(item.restarted / item.completed)}
Highest  ${getConfig.typingSpeedUnit.toUpperCase()}: ${formatSpeed(item.maxWpm)}
Average ${getConfig.typingSpeedUnit.toUpperCase()}: ${formatSpeed(item.avgWpm)}
Average Accuracy: ${formatAccuracy(item.avgAcc, { showDecimalPlaces: true })}
Average Consistency: ${formatPercentage(item.avgConsistency, { showDecimalPlaces: true })}
                          `;
                        },
                        label: function (): string {
                          return "";
                        },
                      },
                    },
                  },
                }}
              />
            }
          >
            <Chart
              definition={definition()}
              ariaLabel="Daily activity"
              // responsive per the TanStack guide: no width (the host follows
              // the container; initialWidth seeds the first frame) and a fixed
              // height, like the 200 px wrapper and the canvas it replaces
              height={200}
              initialWidth={640}
            />
          </Show>
        </div>
      )}
    </AsyncContent>
  );
}

/**
 * The TanStack definition of the daily activity chart: minutes bars over a
 * utc day x scale and a zero-based count scale, the average-speed line and
 * dots on a named right scale, and the trendline the old plugin drew over
 * the bars. Pure: asserted in
 * __tests__/components/pages/account/DailyActivityChart.spec.tsx.
 */
export function buildDailyActivityChartDefinition(
  days: readonly DailyActivityDay[],
  theme: () => Theme,
  beginAtZero: boolean,
  unitName: TypingSpeedUnit,
  unit: TypingSpeedUnitSettings,
) {
  const UNIT = unitName.toUpperCase();
  const minutes = (it: DailyActivityDay) => it.timeTyping / 60;
  const speed = (it: DailyActivityDay) => unit.fromWpm(it.avgWpm);
  const maxSpeed = Math.max(0, ...days.map((it) => unit.fromWpm(it.avgWpm)));
  const formatDay = (value: Date) => dateFormat(value, "d MMM");
  const day = (it: DailyActivityDay) => new Date(it.dayTimestamp);

  return defineChart({
    marks: [
      // the old draw order: line (2) under the bars (3), the trendline last
      lineY(days, {
        id: "speed",
        x: day,
        y: speed,
        yScale: "avgWpm",
        stroke: theme().sub,
        strokeWidth: 3,
      }),
      dot(days, {
        id: "speed-points",
        x: day,
        y: speed,
        yScale: "avgWpm",
        color: () => theme().sub,
        r: 3,
      }),
      barY(days, {
        id: "minutes",
        x: day,
        y: minutes,
        fill: theme().main,
      }),
      // the plugin fits one line over the data and draws nothing under two
      // days; its "dotted" lineStyle is setLineDash([2, 2]) at the dataset's
      // 3 px border width, and ci: 0 keeps the old no-band look
      ...(days.length > 1
        ? [
            linearRegressionY(days, {
              id: "trend",
              x: day,
              y: minutes,
              stroke: theme().sub,
              strokeWidth: 3,
              strokeDasharray: "2 2",
              ci: 0,
            }),
          ]
        : []),
    ],
    scales: {
      x: {
        scale: () => scaleUtc(),
        grid: { stroke: theme().subAlt },
        axis: {
          line: { stroke: theme().subAlt },
          ticks: {
            // the old autoSkip + padding 20 with rotated labels
            spacing: 55,
            format: (value: Date) => formatDay(value),
          },
        },
      },
      // the old left axis (chart.js "count"): the reserved `y` id, read by
      // the minutes bars and the trendline
      y: {
        channel: "y",
        scale: () => scaleLinear(),
        nice: true,
        grid: false,
        axis: {
          label: "Time typing (minutes)",
          line: { stroke: theme().subAlt },
        },
      },
      avgWpm: {
        channel: "y",
        side: "right",
        scale: () => scaleLinear(),
        nice: true,
        // the old scale: from zero when configured, else fitted to the line;
        // the viewport only when the max is positive - the library rejects a
        // [0, 0] domain, which all-zero days would produce
        ...(beginAtZero && maxSpeed > 0
          ? { viewport: { domain: [0, maxSpeed] } }
          : {}),
        grid: false,
        axis: {
          label: `Average ${UNIT}`,
          line: { stroke: theme().subAlt },
        },
      },
    },
    // the old tooltip: a single (bar) body item whose beforeLabel carries all
    // the day's stats; the group-x focus keeps the line and dots under the
    // pointer, as the old index mode did
    tooltip: {
      use: tooltip,
      // the old tooltip animated 250 ms between days
      motion: { type: "tween", duration: 250, easing: "ease-out" },
      content: (
        points,
      ): {
        title?: string;
        rows: ChartTooltipRow[];
      } => {
        const point = points[0];
        if (!point) return { rows: [] };
        const it = point.datum as DailyActivityDay;
        const formatSpeed = (wpm: number): string =>
          formatTypingSpeed(wpm, { showDecimalPlaces: true });
        const tooltipRows: ChartTooltipRow[] = [
          {
            label: `Time Typing: ${secondsToString(Math.round(it.timeTyping), true, true)}`,
            value: "",
            color: point.color,
          },
          { label: `Tests Completed: ${it.completed}`, value: "" },
          {
            label: `Restarts per test: ${roundTo2(it.restarted / it.completed)}`,
            value: "",
          },
          { label: `Highest  ${UNIT}: ${formatSpeed(it.maxWpm)}`, value: "" },
          { label: `Average ${UNIT}: ${formatSpeed(it.avgWpm)}`, value: "" },
          {
            label: `Average Accuracy: ${formatAccuracy(it.avgAcc, { showDecimalPlaces: true })}`,
            value: "",
          },
          {
            label: `Average Consistency: ${formatPercentage(it.avgConsistency, { showDecimalPlaces: true })}`,
            value: "",
          },
        ];
        return {
          title: dateFormat(new Date(it.dayTimestamp), "dd MMM yyyy"),
          rows: tooltipRows,
        };
      },
    },
    focus: "group-x",
  });
}
