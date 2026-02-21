import { roundTo2 } from "@monkeytype/util/numbers";
import { TooltipItem } from "chart.js";
import { format as dateFormat } from "date-fns/format";
import { Accessor, JSXElement } from "solid-js";

import {
  ResultsQueryState,
  useResultStatsLiveQuery,
} from "../../../collections/results";
import { getTheme } from "../../../signals/theme";
import { secondsToString } from "../../../utils/date-and-time";
import { Formatting } from "../../../utils/format";
import { TypingSpeedUnitSettings } from "../../../utils/typing-speed-units";
import AsyncContent from "../../common/AsyncContent";
import { ChartJs } from "../../common/ChartJs";

export function DailyActivityChart(props: {
  queryState: Accessor<ResultsQueryState | undefined>;
  beginAtZero: boolean;
  typingSpeedUnit: TypingSpeedUnitSettings;
  format: Formatting;
}): JSXElement {
  const dataQuery = useResultStatsLiveQuery(props.queryState, {
    groupByDay: true,
  });

  const formatSpeed = (wpm: number): string =>
    props.format.typingSpeed(wpm, { showDecimalPlaces: true });

  return (
    <AsyncContent collection={dataQuery}>
      {(data) => (
        <div style={{ height: "200px" }}>
          <ChartJs
            type="bar"
            data={{
              labels: data.map((it) => it.dayTimeamp),
              datasets: [
                {
                  yAxisID: "count",
                  data: data.map((it) => Math.round(it.timeTyping / 60)),
                  backgroundColor: getTheme().main,
                  trendlineLinear: {
                    style: getTheme().sub,
                    lineStyle: "dotted",
                    width: 2,
                  },
                  order: 3,
                },
                {
                  yAxisID: "avgWpm",
                  data: data.map((it) =>
                    props.typingSpeedUnit.fromWpm(it.avgWpm),
                  ),
                  borderColor: getTheme().sub,
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
                  beginAtZero: props.beginAtZero,
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
                    text:
                      "Average " + props.format.typingSpeedUnit.toUpperCase(),
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

                      const item = data[firstItem.dataIndex];
                      if (item === undefined) return "unknown";

                      return dateFormat(
                        new Date(item.dayTimeamp as number),
                        "dd MMM yyy",
                      );
                    },
                    beforeLabel: function (tooltipItem): string {
                      const item = data[tooltipItem.dataIndex];
                      if (item === undefined) return "unknown";

                      return `
Time Typing: ${secondsToString(Math.round(item.timeTyping), true, true)}
Tests Completed: ${item.completed}
Restarts per test: ${roundTo2(item.restarted / item.completed)}
Highest  ${props.format.typingSpeedUnit.toUpperCase()}: ${formatSpeed(item.maxWpm)}
Average ${props.format.typingSpeedUnit.toUpperCase()}: ${formatSpeed(item.avgWpm)}
Average Accuracy: ${props.format.accuracy(item.avgAcc, { showDecimalPlaces: true })}
Average Consistency: ${props.format.percentage(item.avgConsistency, { showDecimalPlaces: true })}
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
        </div>
      )}
    </AsyncContent>
  );
}
