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
  chartAnnotation,
);

(
  Chart.defaults.animation as AnimationSpec<"line" | "bar" | "scatter">
).duration = 0;
Chart.defaults.elements.line.tension = 0.5;
Chart.defaults.elements.line.fill = "origin";

import "chartjs-adapter-date-fns";
import { Config } from "../config/store";
import { configEvent } from "../events/config";
import * as TestInput from "../test/test-input";
import * as Arrays from "../utils/arrays";
import { blendTwoHexColors } from "../utils/colors";
import { typedKeys } from "../utils/misc";
import { getTheme } from "../states/theme";
import { Theme } from "../constants/themes";
import { createDebouncedEffectOn } from "../hooks/effects";

export class ChartWithUpdateColors<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown,
  DatasetIds = never,
> extends Chart<TType, TData, TLabel> {
  // oxlint-disable-next-line no-useless-constructor
  constructor(
    item: ChartItem,
    config: ChartConfiguration<TType, TData, TLabel>,
  ) {
    super(item, config);
  }

  async updateColors(theme: Theme): Promise<void> {
    //@ts-expect-error it's too difficult to figure out these types, but this works
    await updateColors(this, theme);
  }

  getDataset(id: DatasetIds): ChartDataset<TType, TData> {
    //@ts-expect-error it's too difficult to figure out these types, but this works
    return this.data.datasets?.find((x) => x.yAxisID === id);
  }

  getScaleIds(): DatasetIds[] {
    //@ts-expect-error it's too difficult to figure out these types, but this works
    return typedKeys(this.options?.scales ?? {}) as DatasetIds[];
  }

  getScale(
    id: DatasetIds extends never ? never : "x" | DatasetIds,
  ): DatasetIds extends never ? never : CartesianScaleOptions {
    //@ts-expect-error it's too difficult to figure out these types, but this works
    // oxlint-disable-next-line no-unsafe-return, no-unsafe-member-access
    return this.options.scales[id];
  }
}

let prevTi: TooltipItem<"line" | "scatter"> | undefined;
export const result = new ChartWithUpdateColors<
  "line" | "scatter",
  number[],
  string,
  "wpm" | "raw" | "error" | "burst"
>(document.querySelector("#wpmChart") as HTMLCanvasElement, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        //@ts-expect-error the type is defined incorrectly, have to ignore the error
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
        //@ts-expect-error the type is defined incorrectly, have to ignore the error
        clip: false,
        label: "raw",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "raw",
        borderDash: [8, 8],
        order: 3,
        pointRadius: 0,
      },
      {
        //@ts-expect-error the type is defined incorrectly, have to ignore the error
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
      {
        //@ts-expect-error the type is defined incorrectly, have to ignore the error
        clip: false,
        label: "burst",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 3,
        yAxisID: "burst",
        order: 4,
        pointRadius: 1,
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
      burst: {
        axis: "y",
        display: false,
        title: {
          display: true,
          text: "Burst Words per Minute",
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
                lastHighlightWordIndex,
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

export type HistoryChartData = {
  x: number;
  y: number;
  wpm: number;
  acc: number;
  mode: string;
  mode2: string;
  punctuation: boolean;
  language: string;
  timestamp: number;
  difficulty: string;
  raw: number;
  isPb: boolean;
};

export type AccChartData = {
  x: number;
  y: number;
  errorRate: number;
};

export type OtherChartData = {
  x: number;
  y: number;
};

export type ActivityChartDataPoint = {
  x: number;
  y: number;
  maxWpm?: number;
  restarts?: number;
  amount?: number;
  avgWpm?: number;
  avgAcc?: number;
  avgCon?: number;
};

async function updateColors<
  TType extends ChartType = "bar" | "line" | "scatter",
  TData =
    | HistoryChartData[]
    | AccChartData[]
    | ActivityChartDataPoint[]
    | number[],
  TLabel = string,
>(
  chart: ChartWithUpdateColors<TType, TData, TLabel>,
  colors: Theme,
): Promise<void> {
  const gridcolor = colors.subAlt;

  for (const scaleKey of typedKeys(chart.scales)) {
    //@ts-expect-error cant figure out this type but it works fine
    const scale = chart.getScale(scaleKey) as CartesianScaleOptions;
    scale.grid.color = gridcolor;
    scale.grid.tickColor = gridcolor;
    scale.grid.borderColor = gridcolor;
    scale.ticks.color = colors.sub;
    scale.title.color = colors.sub;
  }

  if (chart.id === result.id) {
    const c = chart as unknown as typeof result;

    const wpm = c.getDataset("wpm");
    wpm.backgroundColor = "transparent";
    wpm.borderColor = colors.main;
    wpm.pointBackgroundColor = colors.main;
    wpm.pointBorderColor = colors.main;

    const raw = c.getDataset("raw");
    raw.backgroundColor = "transparent";
    raw.borderColor = colors.main + "99";
    raw.pointBackgroundColor = colors.main + "99";
    raw.pointBorderColor = colors.main + "99";

    const error = c.getDataset("error");
    error.backgroundColor = colors.error;
    error.borderColor = colors.error;
    error.pointBackgroundColor = colors.error;
    error.pointBorderColor = colors.error;

    const burst = c.getDataset("burst");
    burst.backgroundColor = blendTwoHexColors(
      colors.subAlt,
      colors.subAlt + "00",
      0.5,
    );
    burst.borderColor = colors.sub;
    burst.pointBackgroundColor = colors.sub;
    burst.pointBorderColor = colors.sub;

    chart.update("resize");
    return;
  }

  //@ts-expect-error it's too difficult to figure out these types, but this works
  chart.data.datasets[0].borderColor = (ctx): string => {
    // oxlint-disable-next-line no-unsafe-member-access
    const isPb = ctx.raw?.isPb as boolean;
    const color = isPb ? colors.text : colors.main;
    return color;
  };

  if (chart.data.datasets[1]) {
    chart.data.datasets[1].borderColor = colors.sub;
  }
  if (chart.data.datasets[2]) {
    chart.data.datasets[2].borderColor = colors.error;
  }

  const dataset0 = (
    chart.data.datasets as ChartDataset<"line", TData>[]
  )[0] as ChartDataset<"line", TData>;

  if (chart?.data?.datasets[0]?.type === undefined) {
    if (chart.config.type === "line") {
      dataset0.pointBackgroundColor = (ctx): string => {
        //@ts-expect-error not sure why raw comes out to unknown, but this works
        const isPb = ctx.raw?.isPb as boolean;
        const color = isPb ? colors.text : colors.main;
        return color;
      };
    } else if (chart.config.type === "bar") {
      dataset0.backgroundColor = colors.main;
    }
  } else if (chart.data.datasets[0].type === "bar") {
    chart.data.datasets[0].backgroundColor = colors.main;
  } else if (chart.data.datasets[0].type === "line") {
    dataset0.pointBackgroundColor = colors.main;
  }

  const dataset1 = chart.data.datasets[1] as ChartDataset<"line", TData>;

  if (dataset1 !== undefined) {
    if (dataset1.type === undefined) {
      if (chart.config.type === "line") {
        dataset1.pointBackgroundColor = colors.sub;
      } else if (chart.config.type === "bar") {
        dataset1.backgroundColor = colors.sub;
      }
    } else if ((dataset1?.type as "bar" | "line") === "bar") {
      dataset1.backgroundColor = colors.sub;
    } else if (dataset1.type === "line") {
      dataset1.pointBackgroundColor = colors.sub;
    }
  }
  if (chart.data.datasets.length === 2) {
    dataset1.borderColor = (): string => {
      const color = colors.sub;
      return color;
    };
  }

  const dataset2 = chart.data.datasets[2] as ChartDataset<"line", TData>;

  if (chart.data.datasets.length === 7) {
    dataset2.borderColor = (): string => {
      const color = colors.sub;
      return color;
    };
    const avg10On = Config.accountChart[2] === "on";
    const avg100On = Config.accountChart[3] === "on";

    const text02 = blendTwoHexColors(colors.bg, colors.text, 0.2);
    const main02 = blendTwoHexColors(colors.bg, colors.main, 0.2);
    const main04 = blendTwoHexColors(colors.bg, colors.main, 0.4);

    const sub02 = blendTwoHexColors(colors.bg, colors.sub, 0.2);
    const sub04 = blendTwoHexColors(colors.bg, colors.sub, 0.4);

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
    ) {
      return;
    }

    if (avg10On && avg100On) {
      wpmDataset.pointBackgroundColor = main02;
      pbDataset.borderColor = text02;
      accDataset.pointBackgroundColor = sub02;
      ao10wpmDataset.borderColor = main04;
      ao10accDataset.borderColor = sub04;
      ao100wpmDataset.borderColor = colors.main;
      ao100accDataset.borderColor = colors.sub;
    } else if ((avg10On && !avg100On) || (!avg10On && avg100On)) {
      pbDataset.borderColor = text02;
      wpmDataset.pointBackgroundColor = main04;
      accDataset.pointBackgroundColor = sub04;
      ao10wpmDataset.borderColor = colors.main;
      ao100wpmDataset.borderColor = colors.main;
      ao10accDataset.borderColor = colors.sub;
      ao100accDataset.borderColor = colors.sub;
    } else {
      pbDataset.borderColor = text02;
      wpmDataset.pointBackgroundColor = colors.main;
      accDataset.pointBackgroundColor = colors.sub;
    }
  }

  const chartScaleOptions = chart.options as ScaleChartOptions<TType>;
  Object.keys(chartScaleOptions.scales).forEach((scaleID) => {
    const axis = chartScaleOptions.scales[scaleID] as CartesianScaleOptions;
    axis.ticks.color = colors.sub;
    axis.title.color = colors.sub;
    axis.grid.color = gridcolor;
    axis.grid.tickColor = gridcolor;
    axis.grid.borderColor = gridcolor;
  });

  try {
    (
      dataset0.trendlineLinear as TrendlineLinearPlugin.TrendlineLinearOptions
    ).style = colors.sub;
  } catch {}

  (
    (chart.options as PluginChartOptions<TType>).plugins.annotation
      .annotations as AnnotationOptions<"line">[]
  ).forEach((annotation) => {
    if (annotation.id !== "funbox-label") {
      annotation.borderColor = colors.sub;
    }
    (annotation.label as LabelOptions).backgroundColor = colors.sub;
    (annotation.label as LabelOptions).color = colors.bg;
  });

  chart.update("none");
}

function setDefaultFontFamily(font: string): void {
  Chart.defaults.font.family = font.replace(/_/g, " ");
}

createDebouncedEffectOn(125, getTheme, (theme) => {
  void result.updateColors(theme);
});

configEvent.subscribe(({ key, newValue }) => {
  if (key === "fontFamily") setDefaultFontFamily(newValue);
});
