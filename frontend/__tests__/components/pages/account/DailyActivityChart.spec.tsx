import { render } from "@solidjs/testing-library";
import { createChartScene } from "@tanstack/charts/scene";
import { afterEach, describe, expect, it, vi } from "vitest";

// jsdom has no font metrics: a deterministic stub keeps the scene layout stable
vi.mock("@tanstack/charts/scene", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/charts/scene")>();
  return {
    ...actual,
    createChartScene: (
      definition: unknown,
      size: { width: number; height: number },
    ) =>
      actual.createChartScene(definition as never, size, {
        measureText: (text: string) => ({
          x: 0,
          y: 0,
          width: text.length * 6,
          height: 10,
        }),
      }),
  };
});
// no canvas in jsdom - the chart halves render test markers
vi.mock("../../../../src/ts/components/common/ChartJs", () => ({
  ChartJs: () => <div data-testid="chartjs" />,
}));
vi.mock("@tanstack/charts/solid", () => ({
  Chart: (props: { ariaLabel?: string }) => (
    <div data-testid="tanstack-chart" aria-label={props.ariaLabel} />
  ),
}));
// the daily stats come from a live db query; the spec feeds fixed days
vi.mock("../../../../src/ts/collections/results", () => ({
  useResultStatsLiveQuery: () => {
    const data = (() =>
      (globalThis as { __mockDays?: DailyActivityDay[] }).__mockDays ??
      []) as unknown as {
      isLoading: boolean;
      isError: boolean;
    } & (() => DailyActivityDay[]);
    data.isLoading = false;
    data.isError = false;
    return data;
  },
}));

import type { SceneNode } from "@tanstack/charts";

import { roundTo2 } from "@monkeytype/util/numbers";
import { format } from "date-fns";

import type { DailyActivityDay } from "../../../../src/ts/components/pages/account/DailyActivityChart";

import {
  buildDailyActivityChartDefinition,
  DailyActivityChart,
} from "../../../../src/ts/components/pages/account/DailyActivityChart";
import { Theme } from "../../../../src/ts/constants/themes";
import {
  getUseTanstackCharts,
  setUseTanstackCharts,
} from "../../../../src/ts/dev/chart-parity";
import { secondsToString } from "../../../../src/ts/utils/date-and-time";
import {
  formatAccuracy,
  formatPercentage,
  formatTypingSpeed,
} from "../../../../src/ts/utils/format";
import { get as getTypingSpeedUnit } from "../../../../src/ts/utils/typing-speed-units";

const theme = (): Theme =>
  ({
    name: "default",
    bg: "#111111",
    main: "#222222",
    caret: "#333333",
    sub: "#444444",
    subAlt: "#555555",
    text: "#666666",
    error: "#777777",
    errorExtra: "#888888",
    colorfulError: "#777777",
    colorfulErrorExtra: "#888888",
  }) as Theme;

const unit = getTypingSpeedUnit("wpm");

// three consecutive days of stats (midnight UTC)
const mockDays: DailyActivityDay[] = [
  {
    dayTimestamp: Date.parse("2025-12-01"),
    timeTyping: 3600,
    completed: 12,
    restarted: 1,
    maxWpm: 85,
    avgWpm: 62,
    avgAcc: 96.2,
    avgConsistency: 88.4,
  },
  {
    dayTimestamp: Date.parse("2025-12-02"),
    timeTyping: 5400,
    completed: 20,
    restarted: 3,
    maxWpm: 91,
    avgWpm: 74.5,
    avgAcc: 93.1,
    avgConsistency: 91.0,
  },
  {
    dayTimestamp: Date.parse("2025-12-03"),
    timeTyping: 1200,
    completed: 4,
    restarted: 0,
    maxWpm: 48,
    avgWpm: 40,
    avgAcc: 98.8,
    avgConsistency: 95.5,
  },
];
(globalThis as { __mockDays?: DailyActivityDay[] }).__mockDays = mockDays;

describe("buildDailyActivityChartDefinition", () => {
  const scene = (beginAtZero: boolean): ReturnType<typeof createChartScene> =>
    createChartScene(
      buildDailyActivityChartDefinition(
        mockDays,
        theme,
        beginAtZero,
        "wpm",
        unit,
      ),
      { width: 800, height: 200 },
    );

  it("places each day on a utc x scale", () => {
    const { scales } = scene(false);

    const domain = scales["x"]?.domain as [Date, Date] | undefined;
    expect(domain?.[0]?.getTime()).toBe(mockDays[0]?.dayTimestamp);
    expect(domain?.[1]?.getTime()).toBe(mockDays[2]?.dayTimestamp);
  });

  it("binds the minutes bars to the count scale and the speed line to the avgWpm scale", () => {
    const { scales, points } = scene(false);

    expect(scales["y"]).toBeDefined();
    expect(scales["avgWpm"]).toBeDefined();

    const minutesScale = scales["y"] as { map: (value: unknown) => number };
    const avgWpm = scales["avgWpm"] as { map: (value: unknown) => number };

    const minutes = points.filter((it) => it.markId === "minutes");
    expect(minutes).toHaveLength(mockDays.length);
    expect(minutes.map((it) => it.yValue)).toEqual([60, 90, 20]);
    expect(minutes.every((it) => it.color === "#222222")).toBe(true);
    // the bar pixels resolve through the count scale
    expect(minutes[0]?.y).toBe(minutesScale.map(60));

    const speed = points.filter((it) => it.markId === "speed");
    expect(speed).toHaveLength(mockDays.length);
    expect(speed.map((it) => it.yValue)).toEqual([62, 74.5, 40]);
    expect(speed.every((it) => it.color === "#444444")).toBe(true);
    // the line pixels resolve through the avgWpm scale, not the count one
    expect(speed[1]?.y).toBe(avgWpm.map(74.5));
    expect(speed[1]?.y).not.toBe(minutesScale.map(74.5));
  });

  it("follows beginAtZero on the speed scale", () => {
    const atZero = scene(true).scales["avgWpm"]?.domain as [number, number];
    expect(atZero[0]).toBe(0);
    expect(atZero[1]).toBeGreaterThanOrEqual(74.5);

    const free = scene(false).scales["avgWpm"]?.domain as [number, number];
    expect(free[0]).toBe(40);
    expect(free[1]).toBeGreaterThanOrEqual(74.5);
  });

  it("renders all-zero days without crashing (the zero viewport is skipped)", () => {
    const zeroDays = [
      {
        dayTimestamp: Date.parse("2025-12-01"),
        timeTyping: 0,
        completed: 0,
        restarted: 0,
        maxWpm: 0,
        avgWpm: 0,
        avgAcc: 0,
        avgConsistency: 0,
      },
      {
        dayTimestamp: Date.parse("2025-12-02"),
        timeTyping: 0,
        completed: 0,
        restarted: 0,
        maxWpm: 0,
        avgWpm: 0,
        avgAcc: 0,
        avgConsistency: 0,
      },
    ];

    // the library rejects a [0, 0] viewport domain; the fitted scale handles
    // the zero content instead
    const scene = createChartScene(
      buildDailyActivityChartDefinition(
        zeroDays,
        theme,
        true,
        "wpm",
        getTypingSpeedUnit("wpm"),
      ),
      { width: 800, height: 200 },
    );
    const domain = scene.scales["avgWpm"]?.domain as [number, number];
    expect(domain[0]).toBe(0);
    expect(domain[1]).toBeGreaterThanOrEqual(1);
  });

  it("fits a trendline over the minutes, without a confidence band", () => {
    const { nodes } = scene(false);

    const flatten = (node: SceneNode): SceneNode[] => [
      node,
      ...(node.kind === "group" ? node.children : []).flatMap(flatten),
    ];
    const all = nodes.flatMap(flatten);

    // the regression composite is transparent: its line child renders as a
    // polyline keyed `trend:line:...`, the band (omitted) would be `trend:band`
    const line = all.find(
      (it) => it.kind === "polyline" && it.key.startsWith("trend:line"),
    ) as
      | { style?: { strokeDasharray?: string; strokeWidth?: number } }
      | undefined;
    // the plugin's "dotted" lineStyle is setLineDash([2, 2]) and it reads
    // the dataset borderWidth (3)
    expect(line?.style?.strokeDasharray).toBe("2 2");
    expect(line?.style?.strokeWidth).toBe(3);
    // ci: 0 hides the band area the plugin never drew
    expect(
      all.some(
        (it) => typeof it.key === "string" && it.key.startsWith("trend:band"),
      ),
    ).toBe(false);
  });

  it("focuses by day (group-x) and reproduces the six-line tooltip", () => {
    const definition = buildDailyActivityChartDefinition(
      mockDays,
      theme,
      false,
      "wpm",
      unit,
    );

    expect(definition.focus).toEqual("group-x");

    const { points } = scene(false);
    const day = mockDays[1] as DailyActivityDay;
    const focused = points.find(
      (it) => it.markId === "minutes" && it.datum === day,
    );
    expect(focused).toBeDefined();

    const result = definition.tooltip?.content?.([focused as never]);
    expect(result?.title).toBe(
      format(new Date(day.dayTimestamp), "dd MMM yyyy"),
    );
    expect(result?.rows.map((row) => row.label)).toEqual([
      "Time Typing",
      "Tests Completed",
      "Restarts per test",
      "Highest WPM",
      "Average WPM",
      "Average Accuracy",
      "Average Consistency",
    ]);
    expect(result?.rows.map((row) => row.value)).toEqual([
      secondsToString(Math.round(day.timeTyping), true, true),
      day.completed.toString(),
      roundTo2(day.restarted / day.completed).toString(),
      formatTypingSpeed(day.maxWpm, { showDecimalPlaces: true }),
      formatTypingSpeed(day.avgWpm, { showDecimalPlaces: true }),
      formatAccuracy(day.avgAcc, { showDecimalPlaces: true }),
      formatPercentage(day.avgConsistency, { showDecimalPlaces: true }),
    ]);
    // the bar swatch on the first line only, like the old filtered index tooltip
    expect(result?.rows[0]?.color).toBe("#222222");
    expect(result?.rows[1]?.color).toBeUndefined();
  });
});

describe("DailyActivityChart", () => {
  const unit = getTypingSpeedUnit("wpm");

  afterEach(() => {
    setUseTanstackCharts(false);
  });

  it("renders the Chart.js half by default", () => {
    const { getByTestId, queryByTestId } = render(() => (
      <DailyActivityChart
        queryState={() => undefined}
        beginAtZero={true}
        typingSpeedUnit={unit}
      />
    ));

    expect(getUseTanstackCharts()).toBe(false);
    expect(getByTestId("chartjs")).not.toBeNull();
    expect(queryByTestId("tanstack-chart")).toBeNull();
  });

  it("renders the TanStack half when the parity flag is on", () => {
    setUseTanstackCharts(true);

    const { getByTestId, queryByTestId } = render(() => (
      <DailyActivityChart
        queryState={() => undefined}
        beginAtZero={true}
        typingSpeedUnit={unit}
      />
    ));

    expect(getUseTanstackCharts()).toBe(true);
    expect(getByTestId("tanstack-chart")).not.toBeNull();
    expect(queryByTestId("chartjs")).toBeNull();
  });
});
