import * as ResultWordHighlight from "../elements/result-word-highlight";

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  ScatterController,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  type ChartItem,
  type AnimationSpec,
  type CartesianScaleOptions,
  type ChartConfiguration,
  type ChartDataset,
  type ChartType,
  type DefaultDataPoint,
  type PluginChartOptions,
  type ScaleChartOptions,
  TooltipItem,
} from "chart.js";

import chartAnnotation, {
  type AnnotationOptions,
  type LabelOptions,
} from "chartjs-plugin-annotation";
import chartTrendline from "chartjs-plugin-trendline";

import * as ActivePage from "../states/active-page";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  chartTrendline,
  chartAnnotation
);

(
  Chart.defaults.animation as AnimationSpec<"line" | "bar" | "scatter">
).duration = 0;
Chart.defaults.elements.line.tension = 0.3;
Chart.defaults.elements.line.fill = "origin";

import "chartjs-adapter-date-fns";
import { format } from "date-fns/format";
import Config from "../config";
import * as ThemeColors from "../elements/theme-colors";
import * as ConfigEvent from "../observables/config-event";
import * as TestInput from "../test/test-input";
import * as DateTime from "../utils/date-and-time";
import * as Arrays from "../utils/arrays";
import * as Numbers from "../utils/numbers";
import { blendTwoHexColors } from "../utils/colors";

class ChartWithUpdateColors<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown,
  DatasetIds = never
> extends Chart<TType, TData, TLabel> {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    item: ChartItem,
    config: ChartConfiguration<TType, TData, TLabel>
  ) {
    super(item, config);
  }

  async updateColors(): Promise<void> {
    await updateColors(this);
  }

  getDataset(id: DatasetIds): ChartDataset<TType, TData> {
    //@ts-expect-error
    return this.data.datasets?.find((x) => x.yAxisID === id);
  }

  getScale(
    id: DatasetIds extends never ? never : "x" | DatasetIds
  ): DatasetIds extends never ? never : CartesianScaleOptions {
    //@ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.options.scales[id];
  }
}

let prevTi: TooltipItem<"line" | "scatter"> | undefined;
export const result = new ChartWithUpdateColors<
  "line" | "scatter",
  number[],
  string,
  "wpm" | "raw" | "error"
>(document.querySelector("#wpmChart") as HTMLCanvasElement, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        //@ts-expect-error the type is defined incorrectly, have to ingore the error
        clip: false,
        label: "wpm",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 3,
        yAxisID: "wpm",
        order: 2,
        pointRadius: 1,
      },
      {
        //@ts-expect-error the type is defined incorrectly, have to ingore the error
        clip: false,
        label: "raw",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 3,
        yAxisID: "raw",
        order: 3,
        pointRadius: 1,
      },
      {
        //@ts-expect-error the type is defined incorrectly, have to ingore the error
        clip: false,
        label: "errors",
        data: [],
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 2,
        order: 1,
        yAxisID: "error",
        type: "scatter",
        pointStyle: "crossRot",
        pointRadius: function (context): number {
          const index = context.dataIndex;
          const value = context.dataset.data[index] as number;
          return (value ?? 0) <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context): number {
          const index = context.dataIndex;
          const value = context.dataset.data[index] as number;
          return (value ?? 0) <= 0 ? 0 : 5;
        },
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        axis: "x",
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        display: true,
        title: {
          display: false,
          text: "Seconds",
        },
      },
      wpm: {
        axis: "y",
        display: true,
        title: {
          display: true,
          text: "Words per Minute",
        },
        beginAtZero: true,
        min: 0,
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        grid: {
          display: true,
        },
      },
      raw: {
        axis: "y",
        display: false,
        title: {
          display: true,
          text: "Raw Words per Minute",
        },
        beginAtZero: true,
        min: 0,
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        grid: {
          display: false,
        },
      },
      error: {
        axis: "y",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Errors",
        },
        beginAtZero: true,
        ticks: {
          precision: 0,
          autoSkip: true,
          autoSkipPadding: 20,
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
        mode: "index",
        intersect: false,
        callbacks: {
          afterLabel: function (ti): string {
            if (prevTi === ti) return "";
            prevTi = ti;
            try {
              const keypressIndex = Math.round(parseFloat(ti.label)) - 1;
              const wordsToHighlight =
                TestInput.errorHistory[keypressIndex]?.words;

              const unique = [...new Set(wordsToHighlight)];
              const firstHighlightWordIndex = unique[0];
              const lastHighlightWordIndex =
                Arrays.lastElementFromArray(unique);
              if (
                firstHighlightWordIndex === undefined ||
                lastHighlightWordIndex === undefined
              ) {
                return "";
              }
              void ResultWordHighlight.highlightWordsInRange(
                firstHighlightWordIndex,
                lastHighlightWordIndex
              );
            } catch {}
            return "";
          },
        },
      },
    },
  },
});

export let accountHistoryActiveIndex: number;

export const accountHistory = new ChartWithUpdateColors<
  "line",
  | MonkeyTypes.HistoryChartData[]
  | MonkeyTypes.AccChartData[]
  | MonkeyTypes.OtherChartData[],
  string,
  | "wpm"
  | "pb"
  | "acc"
  | "wpmAvgTen"
  | "accAvgTen"
  | "wpmAvgHundred"
  | "accAvgHundred"
>(
  document.querySelector(
    ".pageAccount #accountHistoryChart"
  ) as HTMLCanvasElement,
  {
    type: "line",
    data: {
      datasets: [
        {
          yAxisID: "wpm",
          data: [],
          fill: false,
          borderWidth: 0,
          order: 3,
        },
        {
          yAxisID: "pb",
          data: [],
          fill: false,
          stepped: true,
          pointRadius: 0,
          pointHoverRadius: 0,
          order: 4,
        },
        {
          yAxisID: "acc",
          fill: false,
          data: [],
          pointStyle: "triangle",
          borderWidth: 0,
          pointRadius: 3.5,
          order: 3,
        },
        {
          yAxisID: "wpmAvgTen",
          data: [],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          order: 2,
        },
        {
          yAxisID: "accAvgTen",
          data: [],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          order: 2,
        },
        {
          yAxisID: "wpmAvgHundred",
          data: [],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          order: 1,
        },
        {
          yAxisID: "accAvgHundred",
          label: "accAvgHundred",
          data: [],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          order: 1,
        },
      ],
    },
    options: {
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
          beginAtZero: true,
          min: 0,
          ticks: {
            stepSize: 10,
          },
          display: true,
          title: {
            display: true,
            text: "Words per Minute",
          },
          position: "right",
        },
        pb: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          ticks: {
            stepSize: 10,
          },
          display: false,
        },
        acc: {
          axis: "y",
          beginAtZero: true,
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
        wpmAvgTen: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          ticks: {
            stepSize: 10,
          },
          display: false,
          grid: {
            display: false,
          },
        },
        accAvgTen: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          max: 100,
          reverse: true,
          ticks: {
            stepSize: 10,
          },
          display: false,
          grid: {
            display: false,
          },
        },
        wpmAvgHundred: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          ticks: {
            stepSize: 10,
          },
          display: false,
          grid: {
            display: false,
          },
        },
        accAvgHundred: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          max: 100,
          reverse: true,
          ticks: {
            stepSize: 10,
          },
          display: false,
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

            beforeLabel: function (tooltipItem): string {
              if (tooltipItem.datasetIndex !== 0) {
                const resultData = tooltipItem.dataset.data[
                  tooltipItem.dataIndex
                ] as MonkeyTypes.AccChartData;
                return `error rate: ${Numbers.roundTo2(
                  resultData.errorRate
                )}%\nacc: ${Numbers.roundTo2(100 - resultData.errorRate)}%`;
              }
              const resultData = tooltipItem.dataset.data[
                tooltipItem.dataIndex
              ] as MonkeyTypes.HistoryChartData;
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

              let diff = resultData.difficulty;
              if (diff === undefined) {
                diff = "normal";
              }
              label += "\n" + `difficulty: ${diff}`;

              label +=
                "\n" +
                `punctuation: ${resultData.punctuation}` +
                "\n" +
                `language: ${resultData.language}` +
                `${resultData.isPb ? "\n\nnew personal best" : ""}` +
                "\n\n" +
                `date: ${format(
                  new Date(resultData.timestamp),
                  "dd MMM yyyy HH:mm"
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
          },
        },
      },
    },
  }
);

export const accountActivity = new ChartWithUpdateColors<
  "bar" | "line",
  MonkeyTypes.ActivityChartDataPoint[],
  string,
  "count" | "avgWpm"
>(
  document.querySelector(
    ".pageAccount #accountActivityChart"
  ) as HTMLCanvasElement,
  {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          yAxisID: "count",
          label: "Seconds",
          data: [],
          trendlineLinear: {
            style: "rgba(255,105,180, .8)",
            lineStyle: "dotted",
            width: 2,
          },
          order: 3,
        },
        {
          yAxisID: "avgWpm",
          label: "Average Wpm",
          data: [],
          type: "line",
          order: 2,
          tension: 0,
          fill: false,
        },
      ],
    },
    options: {
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
        },
        avgWpm: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
            stepSize: 10,
          },
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Average Wpm",
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
          callbacks: {
            title: function (tooltipItem): string {
              const firstItem = tooltipItem[0] as TooltipItem<"bar" | "line">;
              const resultData = firstItem.dataset.data[
                firstItem.dataIndex
              ] as MonkeyTypes.ActivityChartDataPoint;
              return format(new Date(resultData.x), "dd MMM yyyy");
            },
            beforeLabel: function (tooltipItem): string {
              const resultData = tooltipItem.dataset.data[
                tooltipItem.dataIndex
              ] as MonkeyTypes.ActivityChartDataPoint;
              switch (tooltipItem.datasetIndex) {
                case 0:
                  return `Time Typing: ${DateTime.secondsToString(
                    Math.round(resultData.y * 60),
                    true,
                    true
                  )}\nTests Completed: ${resultData.amount}`;
                case 1:
                  return `Average ${Config.typingSpeedUnit}: ${Numbers.roundTo2(
                    resultData.y
                  )}`;
                default:
                  return "";
              }
            },
            label: function (): string {
              return "";
            },
          },
        },
      },
    },
  }
);

export const accountHistogram = new ChartWithUpdateColors<
  "bar",
  MonkeyTypes.ActivityChartDataPoint[],
  string,
  "count"
>(
  document.querySelector(
    ".pageAccount #accountHistogramChart"
  ) as HTMLCanvasElement,
  {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          yAxisID: "count",
          label: "Tests",
          data: [],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      hover: {
        mode: "nearest",
        intersect: false,
      },
      scales: {
        x: {
          axis: "x",
          // ticks: {
          //   autoSkip: true,
          //   autoSkipPadding: 20,
          // },
          bounds: "ticks",
          display: true,
          title: {
            display: false,
            text: "Bucket",
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
            stepSize: 10,
          },
          display: true,
          title: {
            display: true,
            text: "Tests",
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
          // callbacks: {
          //   title: function (tooltipItem): string {
          //     const resultData = tooltipItem[0].dataset.data[
          //       tooltipItem[0].dataIndex
          //     ] as MonkeyTypes.ActivityChartDataPoint;
          //     return format(new Date(resultData.x), "dd MMM yyyy");
          //   },
          //   beforeLabel: function (tooltipItem): string {
          //     const resultData = tooltipItem.dataset.data[
          //       tooltipItem.dataIndex
          //     ] as MonkeyTypes.ActivityChartDataPoint;
          //     switch (tooltipItem.datasetIndex) {
          //       case 0:
          //         return `Time Typing: ${DateTime.secondsToString(
          //           Math.round(resultData.y),
          //           true,
          //           true
          //         )}\nTests Completed: ${resultData.amount}`;
          //       case 1:
          //         return `Average ${
          //           Config.typingSpeedUnit
          //         }: ${Numbers.roundTo2(resultData.y)}`;
          //       default:
          //         return "";
          //     }
          //   },
          //   label: function (): string {
          //     return "";
          //   },
          // },
        },
      },
    },
  }
);

export const globalSpeedHistogram = new ChartWithUpdateColors<
  "bar",
  MonkeyTypes.ActivityChartDataPoint[],
  string,
  "count"
>(
  document.querySelector(
    ".pageAbout #publicStatsHistogramChart"
  ) as HTMLCanvasElement,
  {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          yAxisID: "count",
          label: "Users",
          data: [],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      hover: {
        mode: "nearest",
        intersect: false,
      },
      scales: {
        x: {
          axis: "x",
          bounds: "ticks",
          display: true,
          title: {
            display: false,
            text: "Bucket",
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
            stepSize: 10,
          },
          display: true,
          title: {
            display: true,
            text: "Users",
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
        },
      },
    },
  }
);

export const miniResult = new ChartWithUpdateColors<
  "line" | "scatter",
  number[],
  string,
  "wpm" | "raw" | "error"
>(document.querySelector("#miniResultChartModal canvas") as HTMLCanvasElement, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "wpm",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "wpm",
        order: 2,
        pointRadius: 2,
      },
      {
        label: "raw",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "raw",
        order: 3,
        pointRadius: 2,
      },
      {
        label: "errors",
        data: [],
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 2,
        order: 1,
        yAxisID: "error",
        type: "scatter",
        pointStyle: "crossRot",
        pointRadius: function (context): number {
          const index = context.dataIndex;
          const value = context.dataset.data[index] as number;
          return (value ?? 0) <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context): number {
          const index = context.dataIndex;
          const value = context.dataset.data[index] as number;
          return (value ?? 0) <= 0 ? 0 : 5;
        },
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        axis: "x",
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        display: true,
        title: {
          display: false,
          text: "Seconds",
        },
      },
      wpm: {
        axis: "y",
        display: true,
        title: {
          display: true,
          text: "Words per Minute",
        },
        beginAtZero: true,
        min: 0,
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        grid: {
          display: true,
        },
      },
      raw: {
        axis: "y",
        display: false,
        title: {
          display: true,
          text: "Raw Words per Minute",
        },
        beginAtZero: true,
        min: 0,
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        grid: {
          display: false,
        },
      },
      error: {
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Errors",
        },
        beginAtZero: true,
        ticks: {
          precision: 0,
          autoSkip: true,
          autoSkipPadding: 20,
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
        mode: "index",
        intersect: false,
      },
    },
  },
});

type ButtonBelowChart =
  | ".toggleResultsOnChart"
  | ".toggleAccuracyOnChart"
  | ".toggleAverage10OnChart"
  | ".toggleAverage100OnChart";

export function updateAccountChartButtons(): void {
  updateResults(false);
  updateAccuracy(false);
  updateAverage10(false);
  updateAverage100(false);
}

function updateAccountChartButton(
  isActive: boolean,
  className: ButtonBelowChart
): void {
  isActive
    ? $(`.pageAccount ${className}`).addClass("active")
    : $(`.pageAccount ${className}`).removeClass("active");
}

function updateResults(updateChart = true): void {
  const resultsOn = Config.accountChart[0] === "on";
  updateAccountChartButton(resultsOn, ".toggleResultsOnChart");

  accountHistory.getDataset("wpm").hidden = !resultsOn;
  accountHistory.getDataset("pb").hidden = !resultsOn;
  accountHistory.getDataset("wpmAvgTen").hidden = !resultsOn;
  accountHistory.getDataset("wpmAvgHundred").hidden = !resultsOn;
  accountHistory.getScale("wpm").display = resultsOn;

  if (updateChart) void accountHistory.updateColors();
}

function updateAccuracy(updateChart = true): void {
  const resultsOn = Config.accountChart[0] === "on";
  const accOn = Config.accountChart[1] === "on";
  updateAccountChartButton(accOn, ".toggleAccuracyOnChart");

  accountHistory.getDataset("acc").hidden = !accOn;
  accountHistory.getDataset("accAvgTen").hidden = !accOn;
  accountHistory.getDataset("accAvgHundred").hidden = !accOn;
  accountHistory.getScale("acc").display = accOn;

  if (resultsOn) {
    accountHistory.getScale("acc").min = 0;
    accountHistory.getScale("accAvgTen").min = 0;
    accountHistory.getScale("accAvgHundred").min = 0;
  } else {
    const minAccRoundedTo10 =
      Math.floor(
        Math.min(...accountHistory.getDataset("acc").data.map((x) => x.y)) / 10
      ) * 10;

    accountHistory.getScale("acc").min = minAccRoundedTo10;
    accountHistory.getScale("accAvgTen").min = minAccRoundedTo10;
    accountHistory.getScale("accAvgHundred").min = minAccRoundedTo10;
  }

  if (updateChart) void accountHistory.updateColors();
}

function updateAverage10(updateChart = true): void {
  const resultsOn = Config.accountChart[0] === "on";
  const accOn = Config.accountChart[1] === "on";
  const avg10On = Config.accountChart[2] === "on";
  updateAccountChartButton(avg10On, ".toggleAverage10OnChart");

  if (accOn) {
    accountHistory.getDataset("accAvgTen").hidden = !avg10On;
  }
  if (resultsOn) {
    accountHistory.getDataset("wpmAvgTen").hidden = !avg10On;
  }
  if (updateChart) void accountHistory.updateColors();
}

function updateAverage100(updateChart = true): void {
  const resultsOn = Config.accountChart[0] === "on";
  const accOn = Config.accountChart[1] === "on";
  const avg100On = Config.accountChart[3] === "on";
  updateAccountChartButton(avg100On, ".toggleAverage100OnChart");

  if (accOn) {
    accountHistory.getDataset("accAvgHundred").hidden = !avg100On;
  }
  if (resultsOn) {
    accountHistory.getDataset("wpmAvgHundred").hidden = !avg100On;
  }
  if (updateChart) void accountHistory.updateColors();
}

async function updateColors<
  TType extends ChartType = "bar" | "line" | "scatter",
  TData =
    | MonkeyTypes.HistoryChartData[]
    | MonkeyTypes.AccChartData[]
    | MonkeyTypes.ActivityChartDataPoint[]
    | number[],
  TLabel = string
>(chart: ChartWithUpdateColors<TType, TData, TLabel>): Promise<void> {
  const bgcolor = await ThemeColors.get("bg");
  const subcolor = await ThemeColors.get("sub");
  const subaltcolor = await ThemeColors.get("subAlt");
  const maincolor = await ThemeColors.get("main");
  const errorcolor = await ThemeColors.get("error");
  const textcolor = await ThemeColors.get("text");

  const gridcolor = blendTwoHexColors(bgcolor, subaltcolor, 0.75);

  //@ts-expect-error
  chart.data.datasets[0].borderColor = (ctx): string => {
    const isPb = ctx.raw?.isPb as boolean;
    const color = isPb ? textcolor : maincolor;
    return color;
  };

  if (chart.data.datasets[1]) {
    chart.data.datasets[1].borderColor = subcolor;
  }
  if (chart.data.datasets[2]) {
    chart.data.datasets[2].borderColor = errorcolor;
  }

  const dataset0 = (
    chart.data.datasets as ChartDataset<"line", TData>[]
  )[0] as ChartDataset<"line", TData>;

  if (chart?.data?.datasets[0]?.type === undefined) {
    if (chart.config.type === "line") {
      dataset0.pointBackgroundColor = (ctx): string => {
        //@ts-expect-error
        const isPb = ctx.raw?.isPb as boolean;
        const color = isPb ? textcolor : maincolor;
        return color;
      };
    } else if (chart.config.type === "bar") {
      dataset0.backgroundColor = maincolor;
    }
  } else if (chart.data.datasets[0].type === "bar") {
    chart.data.datasets[0].backgroundColor = maincolor;
  } else if (chart.data.datasets[0].type === "line") {
    dataset0.pointBackgroundColor = maincolor;
  }

  const dataset1 = chart.data.datasets[1] as ChartDataset<"line", TData>;

  if (dataset1 !== undefined) {
    if (dataset1.type === undefined) {
      if (chart.config.type === "line") {
        dataset1.pointBackgroundColor = subcolor;
      } else if (chart.config.type === "bar") {
        dataset1.backgroundColor = subcolor;
      }
    } else if ((dataset1?.type as "bar" | "line") === "bar") {
      dataset1.backgroundColor = subcolor;
    } else if (dataset1.type === "line") {
      dataset1.pointBackgroundColor = subcolor;
    }
  }
  if (chart.data.datasets.length === 2) {
    dataset1.borderColor = (): string => {
      const color = subcolor;
      return color;
    };
  }

  const dataset2 = chart.data.datasets[2] as ChartDataset<"line", TData>;

  if (chart.data.datasets.length === 7) {
    dataset2.borderColor = (): string => {
      const color = subcolor;
      return color;
    };
    const avg10On = Config.accountChart[2] === "on";
    const avg100On = Config.accountChart[3] === "on";

    const text02 = blendTwoHexColors(bgcolor, textcolor, 0.2);
    const main02 = blendTwoHexColors(bgcolor, maincolor, 0.2);
    const main04 = blendTwoHexColors(bgcolor, maincolor, 0.4);

    const sub02 = blendTwoHexColors(bgcolor, subcolor, 0.2);
    const sub04 = blendTwoHexColors(bgcolor, subcolor, 0.4);

    const [
      wpmDataset,
      pbDataset,
      accDataset,
      ao10wpmDataset,
      ao10accDataset,
      ao100wpmDataset,
      ao100accDataset,
    ] = chart.data.datasets as ChartDataset<"line", TData>[];

    if (
      wpmDataset === undefined ||
      pbDataset === undefined ||
      accDataset === undefined ||
      ao10wpmDataset === undefined ||
      ao10accDataset === undefined ||
      ao100wpmDataset === undefined ||
      ao100accDataset === undefined
    )
      return;

    if (avg10On && avg100On) {
      wpmDataset.pointBackgroundColor = main02;
      pbDataset.borderColor = text02;
      accDataset.pointBackgroundColor = sub02;
      ao10wpmDataset.borderColor = main04;
      ao10accDataset.borderColor = sub04;
      ao100wpmDataset.borderColor = maincolor;
      ao100accDataset.borderColor = subcolor;
    } else if ((avg10On && !avg100On) || (!avg10On && avg100On)) {
      pbDataset.borderColor = text02;
      wpmDataset.pointBackgroundColor = main04;
      accDataset.pointBackgroundColor = sub04;
      ao10wpmDataset.borderColor = maincolor;
      ao100wpmDataset.borderColor = maincolor;
      ao10accDataset.borderColor = subcolor;
      ao100accDataset.borderColor = subcolor;
    } else {
      pbDataset.borderColor = text02;
      wpmDataset.pointBackgroundColor = maincolor;
      accDataset.pointBackgroundColor = subcolor;
    }
  }

  const chartScaleOptions = chart.options as ScaleChartOptions<TType>;
  Object.keys(chartScaleOptions.scales).forEach((scaleID) => {
    const axis = chartScaleOptions.scales[scaleID] as CartesianScaleOptions;
    axis.ticks.color = subcolor;
    axis.title.color = subcolor;
    axis.grid.color = gridcolor;
    axis.grid.tickColor = gridcolor;
    axis.grid.borderColor = gridcolor;
  });

  try {
    (
      dataset0.trendlineLinear as TrendlineLinearPlugin.TrendlineLinearOptions
    ).style = subcolor;
  } catch {}

  (
    (chart.options as PluginChartOptions<TType>).plugins.annotation
      .annotations as AnnotationOptions<"line">[]
  ).forEach((annotation) => {
    if (annotation.id !== "funbox-label") {
      annotation.borderColor = subcolor;
    }
    (annotation.label as LabelOptions).backgroundColor = subcolor;
    (annotation.label as LabelOptions).color = bgcolor;
  });

  chart.update("none");
}

function setDefaultFontFamily(font: string): void {
  Chart.defaults.font.family = font.replace(/_/g, " ");
}

export function updateAllChartColors(): void {
  ThemeColors.update();
  void accountHistory.updateColors();
  void accountHistogram.updateColors();
  void globalSpeedHistogram.updateColors();
  void result.updateColors();
  void accountActivity.updateColors();
  void miniResult.updateColors();
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "accountChart" && ActivePage.get() === "account") {
    updateResults();
    updateAccuracy();
    updateAverage10();
    updateAverage100();
  }
  if (eventKey === "fontFamily") setDefaultFontFamily(eventValue as string);
});
