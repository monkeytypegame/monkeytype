import type {
  AnnotationOptions,
  LabelPosition,
} from "chartjs-plugin-annotation";

import { getFunbox } from "@monkeytype/funbox";
import { roundTo2 } from "@monkeytype/util/numbers";
import {
  Chart,
  type ChartData as ChartJsData,
  type ChartOptions,
  type ScriptableContext,
  type TooltipItem,
} from "chart.js";
import {
  createMemo,
  createSignal,
  For,
  JSXElement,
  Show,
  untrack,
} from "solid-js";
import { z } from "zod";

import { useTagsLiveQuery } from "../../../../collections/tags";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { Theme } from "../../../../constants/themes";
import * as DB from "../../../../db";
import { createEffectOn } from "../../../../hooks/effects";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";
import { isAuthenticated } from "../../../../states/core";
import { showSuccessNotification } from "../../../../states/notifications";
import {
  getSmoothedBurst,
  getShowResult,
  resultState,
} from "../../../../states/result";
import { CompletedResult, getLastEventLog } from "../../../../states/test";
import { getTheme } from "../../../../states/theme";
import {
  getRawHistory,
  getTimerBoundaryLabels,
  getWordIndexesForSecond,
} from "../../../../test/events/stats";
import { EventLog } from "../../../../test/events/types";
import { get as getFunboxes } from "../../../../test/funbox/list";
import { FaSolidIcon } from "../../../../types/font-awesome";
import {
  lastElementFromArray,
  smoothWithValueWindow,
} from "../../../../utils/arrays";
import { cn } from "../../../../utils/cn";
import { blendTwoHexColors } from "../../../../utils/colors";
import {
  get as getTypingSpeedUnit,
  TypingSpeedUnitSettings,
} from "../../../../utils/typing-speed-units";
import { Button } from "../../../common/Button";
import { ChartJs } from "../../../common/ChartJs";
import { Fa } from "../../../common/Fa";
import * as ResultWordHighlight from "./result-word-highlight";

type ChartData = {
  labels: string[];
  wpm: number[];
  raw: number[];
  burst: number[];
  err: number[];
};

const fakeChartData = {
  wpm: [
    108, 120, 116, 114, 113, 120, 118, 121, 119, 120, 116, 118, 113, 110, 108,
    110, 107, 107, 108, 109, 110, 112, 114, 112, 111, 109, 110, 108, 108, 109,
  ],
  raw: [
    108, 120, 116, 114, 113, 120, 123, 127, 131, 131, 131, 132, 130, 133, 134,
    134, 131, 129, 129, 128, 129, 130, 131, 129, 129, 127, 127, 128, 127, 127,
  ],
  burst: [
    108, 132, 108, 108, 108, 156, 144, 156, 156, 132, 132, 144, 108, 168, 156,
    132, 96, 108, 120, 120, 144, 156, 144, 84, 132, 84, 132, 156, 108, 120,
  ],
  err: [
    0, 0, 0, 0, 0, 0, 3, 1, 3, 0, 5, 0, 3, 5, 4, 0, 2, 0, 0, 0, 0, 0, 0, 1, 2,
    1, 0, 4, 0, 0,
  ],
};

function buildChartData(
  result: CompletedResult,
  eventLog: EventLog | null,
  unit: TypingSpeedUnitSettings,
  smoothBurst: boolean,
  fake: boolean,
): ChartData {
  const convert = (values: number[]): number[] =>
    values.map((a) => roundTo2(unit.fromWpm(a)));

  if (fake) {
    return {
      labels: fakeChartData.wpm.map((_, i) => (i + 1).toString()),
      wpm: convert(fakeChartData.wpm),
      raw: convert(fakeChartData.raw),
      burst: convert(fakeChartData.burst),
      err: fakeChartData.err,
    };
  }

  if (result.chartData === "toolong" || eventLog === null) {
    return { labels: [], wpm: [], raw: [], burst: [], err: [] };
  }

  const valueWindow = Math.max(...result.chartData.burst) * 0.25;
  return {
    labels: getTimerBoundaryLabels(eventLog, false),
    wpm: convert(result.chartData.wpm),
    raw: convert(getRawHistory(eventLog)),
    burst: convert(
      smoothWithValueWindow(
        result.chartData.burst,
        1,
        smoothBurst ? valueWindow : 0,
      ),
    ),
    err: result.chartData.err,
  };
}

function pbLine(
  id: "lpb" | "tpb",
  value: number,
  content: string,
  theme: Theme,
  fontFamily: string,
  position: LabelPosition = "center",
  xAdjust?: number,
): AnnotationOptions<"line"> {
  return {
    display: true,
    type: "line",
    id,
    scaleID: "wpm",
    value,
    borderColor: `${theme.sub}55`,
    borderWidth: 1,
    label: {
      backgroundColor: theme.sub,
      font: {
        family: fontFamily,
        size: 11,
        style: "normal",
        weight: Chart.defaults.font.weight as string,
        lineHeight: Chart.defaults.font.lineHeight as number,
      },
      color: theme.bg,
      padding: 3,
      borderRadius: 3,
      position,
      xAdjust,
      content,
      display: true,
    },
  };
}

function getLocalPbWpm(result: CompletedResult): number {
  const localPb = DB.getLocalPB(
    result.mode,
    result.mode2,
    result.punctuation,
    result.numbers,
    result.language,
    result.difficulty,
    result.lazyMode,
    getFunbox(result.funbox),
  );
  return localPb?.wpm ?? 0;
}

function buildPbLines(
  localPbWpm: number,
  unit: TypingSpeedUnitSettings,
  theme: Theme,
  fontFamily: string,
  tagPbs: { name: string; pb: number }[],
): AnnotationOptions<"line">[] {
  const lines: AnnotationOptions<"line">[] = [];

  if (localPbWpm !== 0) {
    const value = roundTo2(unit.fromWpm(localPbWpm));
    lines.push(
      pbLine("lpb", value, ` PB: ${value.toFixed(2)} `, theme, fontFamily),
    );
  }

  tagPbs.forEach((tag, i) => {
    const value = unit.fromWpm(tag.pb);
    const start = i % 2 === 0;
    lines.push(
      pbLine(
        "tpb",
        value,
        `${tag.name} PB: ${roundTo2(value).toFixed(2)}`,
        theme,
        fontFamily,
        start ? "start" : "end",
        start ? 15 : -15,
      ),
    );
  });

  return lines;
}

function getMinMax(
  data: ChartData,
  vis: ChartDataVisibility,
  pbLines: AnnotationOptions<"line">[],
  unit: TypingSpeedUnitSettings,
  startAtZero: boolean,
): { min: number; max: number } {
  const values = [
    ...data.wpm,
    ...(vis.burst ? data.burst : []),
    ...(vis.raw ? data.raw : []),
  ];

  let max = Math.max(...values);

  const lineValues = pbLines
    .filter((line) => line.display === true)
    .map((line) => line.value as number);
  if (lineValues.length > 0) {
    const maxLine = Math.max(...lineValues);
    const range = unit.fromWpm(20);
    if (max >= maxLine - range && max <= maxLine + range) {
      max = Math.round(maxLine + range);
    }
  }
  max = Math.ceil(max / 10) * 10;

  // round down to nearest multiple of 10
  const min = startAtZero ? 0 : Math.floor(Math.min(...values) / 10) * 10;
  return { min, max };
}

function funboxLabel(
  result: CompletedResult,
  min: number,
  theme: Theme,
  fontFamily: string,
): AnnotationOptions<"line"> | undefined {
  if (result.funbox.length === 0) return undefined;
  const content = getFunboxes(result.funbox)
    .map((fb) => {
      const extra = fb.functions?.getResultContent?.();
      return extra !== undefined ? `${fb.name}(${extra})` : fb.name;
    })
    .join(" ");
  return {
    display: true,
    id: "funbox-label",
    type: "line",
    scaleID: "wpm",
    value: min,
    borderColor: "transparent",
    borderWidth: 1,
    borderDash: [2, 2],
    label: {
      backgroundColor: "transparent",
      font: {
        family: fontFamily,
        size: 11,
        style: "normal",
        weight: Chart.defaults.font.weight as string,
        lineHeight: Chart.defaults.font.lineHeight as number,
      },
      color: theme.sub,
      padding: 3,
      borderRadius: 3,
      position: "start",
      display: true,
      content,
    },
  };
}

type LegendItem = {
  id: keyof ChartDataVisibility;
  text: string;
  icon?: FaSolidIcon;
  line?: "solid" | "dashed";
  legendColor: string;
  visible?: () => boolean;
};

const hasTagPbLines = (): boolean =>
  resultState.tags.some((tag) => tag.chartPb !== undefined);

const legend: LegendItem[] = [
  {
    id: "pbLine",
    text: "pb",
    icon: "fa-crown",
    legendColor: "[--legend-color:var(--sub-color)]",
    visible: () => isAuthenticated(),
  },
  {
    id: "tagPbLine",
    text: "tag pb",
    icon: "fa-tag",
    legendColor: "[--legend-color:var(--sub-color)]",
    visible: () => isAuthenticated() && hasTagPbLines(),
  },
  {
    id: "raw",
    text: "raw",
    line: "dashed",
    legendColor: "[--legend-color:var(--color-main)]",
  },
  {
    id: "burst",
    text: "burst",
    line: "solid",
    legendColor: "[--legend-color:var(--sub-color)]",
  },
  {
    id: "errors",
    text: "errors",
    icon: "fa-times",
    legendColor: "[--legend-color:var(--color-error)]",
  },
];

type ChartDataVisibility = {
  raw: boolean;
  burst: boolean;
  errors: boolean;
  pbLine: boolean;
  tagPbLine: boolean;
};

const [getChartDataVisibility, setChartDataVisibility] =
  useLocalStorage<ChartDataVisibility>({
    key: "resultChartDataVisibility",
    schema: z
      .object({
        raw: z.boolean(),
        burst: z.boolean(),
        errors: z.boolean(),
        pbLine: z.boolean(),
        tagPbLine: z.boolean(),
      })
      .strict(),
    fallback: {
      raw: true,
      burst: true,
      errors: true,
      pbLine: true,
      tagPbLine: true,
    },
  });

const [isFakeChartData, setFakeChartData] = createSignal(false);

// dev helper
export function toggleFakeChartData(): void {
  setFakeChartData((fake) => !fake);
  showSuccessNotification(isFakeChartData() ? "on" : "off");
}

let prevTooltipItem: TooltipItem<"line" | "scatter"> | undefined;

function highlightWordsForTooltip(ti: TooltipItem<"line" | "scatter">): string {
  if (prevTooltipItem === ti) return "";
  const eventLog = getLastEventLog();
  if (eventLog === null) return "";

  prevTooltipItem = ti;
  try {
    const keypressIndex = Math.round(parseFloat(ti.label)) - 1;
    const unique = [
      ...new Set(getWordIndexesForSecond(eventLog, keypressIndex)),
    ];
    const first = unique[0];
    const last = lastElementFromArray(unique);
    if (first === undefined || last === undefined) return "";
    void ResultWordHighlight.highlightWordsInRange(first, last);
  } catch {}
  return "";
}

function errorPointRadius(size: number) {
  return (context: ScriptableContext<"line" | "scatter">): number => {
    const value = context.dataset.data[context.dataIndex] as number;
    return (value ?? 0) <= 0 ? 0 : size;
  };
}

type ChartConfig = {
  data: ChartJsData<"line" | "scatter", number[], string>;
  options: ChartOptions<"line" | "scatter">;
};

function buildChartConfig(
  data: ChartData,
  vis: ChartDataVisibility,
  annotations: AnnotationOptions<"line">[],
  min: number,
  max: number,
  unit: TypingSpeedUnitSettings,
  theme: Theme,
): ChartConfig {
  const rawColor = `${theme.main}99`;
  const burstFill = blendTwoHexColors(theme.subAlt, `${theme.subAlt}00`, 0.5);

  return {
    data: {
      labels: data.labels,
      datasets: [
        {
          //@ts-expect-error the type is defined incorrectly, have to ignore the error
          clip: false,
          label: getConfig.typingSpeedUnit,
          data: data.wpm,
          borderColor: theme.main,
          backgroundColor: "transparent",
          pointBackgroundColor: theme.main,
          pointBorderColor: theme.main,
          borderWidth: 3,
          yAxisID: "wpm",
          order: 2,
          pointRadius: 1,
        },
        {
          //@ts-expect-error the type is defined incorrectly, have to ignore the error
          clip: false,
          label: "raw",
          data: data.raw,
          hidden: !vis.raw,
          borderColor: rawColor,
          backgroundColor: "transparent",
          pointBackgroundColor: rawColor,
          pointBorderColor: rawColor,
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
          data: data.err,
          hidden: !vis.errors,
          borderColor: theme.error,
          backgroundColor: theme.error,
          pointBackgroundColor: theme.error,
          pointBorderColor: theme.error,
          borderWidth: 2,
          order: 1,
          yAxisID: "error",
          type: "scatter",
          pointStyle: "crossRot",
          pointRadius: errorPointRadius(3),
          pointHoverRadius: errorPointRadius(5),
        },
        {
          //@ts-expect-error the type is defined incorrectly, have to ignore the error
          clip: false,
          label: "burst",
          data: data.burst,
          hidden: !vis.burst,
          borderColor: theme.sub,
          backgroundColor: burstFill,
          pointBackgroundColor: theme.sub,
          pointBorderColor: theme.sub,
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
          ticks: { autoSkip: true, autoSkipPadding: 20 },
          display: true,
          title: { display: false, text: "Seconds" },
        },
        wpm: {
          axis: "y",
          display: true,
          title: { display: true, text: unit.fullUnitString },
          beginAtZero: true,
          min,
          max,
          ticks: { autoSkip: true, autoSkipPadding: 20 },
          grid: { display: true },
        },
        raw: {
          axis: "y",
          display: false,
          title: { display: true, text: "Raw Words per Minute" },
          beginAtZero: true,
          min,
          max,
          ticks: { autoSkip: true, autoSkipPadding: 20 },
          grid: { display: false },
        },
        burst: {
          axis: "y",
          display: false,
          title: { display: true, text: "Burst Words per Minute" },
          beginAtZero: true,
          min,
          max,
          ticks: { autoSkip: true, autoSkipPadding: 20 },
          grid: { display: false },
        },
        error: {
          axis: "y",
          display: true,
          position: "right",
          title: { display: true, text: "Errors" },
          beginAtZero: true,
          max: Math.max(...data.err),
          ticks: { precision: 0, autoSkip: true, autoSkipPadding: 20 },
          grid: { display: false },
        },
      },
      plugins: {
        annotation: { annotations },
        tooltip: {
          animation: { duration: 250 },
          mode: "index",
          intersect: false,
          callbacks: { afterLabel: highlightWordsForTooltip },
        },
      },
    },
  };
}

const emptyChartData: ChartData = {
  labels: [],
  wpm: [],
  raw: [],
  burst: [],
  err: [],
};

export function ResultChart(props: {
  result: CompletedResult;
  eventLog: EventLog;
}): JSXElement {
  const tags = useTagsLiveQuery();
  let chart: Chart<"line" | "scatter", number[]> | undefined;

  // read once per result - saveResult() overwrites the local pb with this result
  const localPbWpm = createMemo(() => {
    const result = props.result;
    return untrack(() => getLocalPbWpm(result));
  });

  const chartConfig = createMemo((prev: ChartConfig | undefined) => {
    const unit = getTypingSpeedUnit(getConfig.typingSpeedUnit);
    const theme = getTheme();
    const vis = getChartDataVisibility();

    // only build while visible - the result outlives the result screen, and
    // showResult() shows it after the details and tags are set, so this runs once per result
    if (!getShowResult()) {
      return (
        prev ?? buildChartConfig(emptyChartData, vis, [], 0, 0, unit, theme)
      );
    }

    const result = props.result;
    const fontFamily = getConfig.fontFamily.replace(/_/g, " ");
    const tagNames = new Map((tags() ?? []).map((t) => [t._id, t.name]));
    const tagPbs = resultState.tags.flatMap((tag) =>
      tag.chartPb !== undefined
        ? [{ name: tagNames.get(tag.id) ?? "", pb: tag.chartPb }]
        : [],
    );

    const data = buildChartData(
      result,
      props.eventLog,
      unit,
      getSmoothedBurst(),
      isFakeChartData(),
    );

    const pbLines = buildPbLines(localPbWpm(), unit, theme, fontFamily, tagPbs);
    for (const line of pbLines) {
      line.display = line.id === "lpb" ? vis.pbLine : vis.tagPbLine;
    }

    const { min, max } = getMinMax(
      data,
      vis,
      pbLines,
      unit,
      getConfig.startGraphsAtZero,
    );
    const label = funboxLabel(result, min, theme, fontFamily);
    const annotations = label !== undefined ? [...pbLines, label] : pbLines;

    return buildChartConfig(data, vis, annotations, min, max, unit, theme);
  });

  // the canvas has no size while the result is hidden
  createEffectOn(
    getShowResult,
    (shown) => {
      if (shown) chart?.resize();
    },
    { defer: true },
  );

  return (
    <div class={cn("group/chart relative h-50 w-full")}>
      <div
        class={cn(
          "pointer-events-none absolute right-0 bottom-[-0.75em] flex rounded bg-bg p-[0.25em] text-em-xs transition-opacity",
          "opacity-0 group-hover/chart:pointer-events-auto group-hover/chart:opacity-100",
        )}
      >
        <Button
          type="button"
          variant="text"
          class="px-3 [--legend-color:var(--color-sub)] hover:bg-sub-alt"
          tabIndex="-1"
          onClick={() =>
            setConfig("startGraphsAtZero", !getConfig.startGraphsAtZero)
          }
          text="scale"
          fa={{
            icon: "fa-chart-line",
            class: "text-sub",
          }}
        />

        <For each={legend}>
          {(item) => {
            const active = (): boolean => getChartDataVisibility()[item.id];
            return (
              <Button
                variant="text"
                class={cn("px-3 hover:bg-sub-alt", item.legendColor, {
                  hidden: item.visible !== undefined && !item.visible(),
                })}
                tabIndex="-1"
                onClick={() =>
                  setChartDataVisibility((vis) => ({
                    ...vis,
                    [item.id]: !vis[item.id],
                  }))
                }
              >
                <Show when={item.icon}>
                  {(icon) => (
                    <Fa icon={icon()} class="leading-0 text-(--legend-color)" />
                  )}
                </Show>
                <Show when={!item.icon}>
                  <div
                    class={cn(
                      "duration-half pointer-events-none h-[0.25em] w-[1.5em] rounded-half transition-[background]",
                      item.line === "dashed"
                        ? "bg-[linear-gradient(90deg,var(--legend-color)_40%,transparent_40%_60%,var(--legend-color)_60%)]"
                        : "bg-(--legend-color)",
                    )}
                  ></div>
                </Show>
                <div
                  class={cn(
                    "pointer-events-none",
                    !active() ? "line-through" : "",
                  )}
                >
                  {item.text}
                </div>
              </Button>
            );
          }}
        </For>
      </div>
      <div
        class="h-full"
        onMouseEnter={() => ResultWordHighlight.setIsHoverChart(true)}
        onMouseLeave={() => {
          ResultWordHighlight.setIsHoverChart(false);
          ResultWordHighlight.clear();
        }}
      >
        <ChartJs
          class="h-full"
          name="Result"
          type="line"
          data={chartConfig().data}
          options={chartConfig().options}
          onChartInit={(c) => (chart = c)}
        />
      </div>
    </div>
  );
}
