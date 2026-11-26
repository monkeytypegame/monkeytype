import { Mode } from "@monkeytype/schemas/shared";
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

import type { NormalizedLocalResult } from "../../../../src/ts/collections/results";

import {
  buildHistogramChartDefinition,
  HistogramChart,
  type HistogramChartRow,
} from "../../../../src/ts/components/pages/account/HistogramChart";
import {
  getUseTanstackCharts,
  setUseTanstackCharts,
} from "../../../../src/ts/dev/chart-parity";
import { get as getTypingSpeedUnit } from "../../../../src/ts/utils/typing-speed-units";

// fixed wpm data: ten wpm buckets up to 50 wpm, one empty bucket
const rows: HistogramChartRow[] = [
  { label: "0-9", count: 3 },
  { label: "10-19", count: 5 },
  { label: "20-29", count: 12 },
  { label: "30-39", count: 0 },
  { label: "40-49", count: 2 },
];

describe("buildHistogramChartDefinition", () => {
  it("places every bucket on the x scale and counts on a zero-based y scale", () => {
    const definition = buildHistogramChartDefinition(rows);

    const scene = createChartScene(definition as never, {
      width: 800,
      height: 200,
    });

    expect(scene.scales["x"]?.domain).toEqual(rows.map((it) => it.label));
    const yDomain = scene.scales["y"]?.domain as [number, number] | undefined;
    expect(yDomain?.[0]).toBe(0);
    expect(yDomain?.[1] ?? 0).toBeGreaterThanOrEqual(12);
  });

  it("keeps one bar per bucket painted in the theme main; zero stays zero", () => {
    const definition = buildHistogramChartDefinition(rows);

    const scene = createChartScene(definition as never, {
      width: 800,
      height: 200,
    });

    expect(scene.points.map((point) => point.yValue)).toEqual([3, 5, 12, 0, 2]);
    expect(scene.points[0]?.xValue).toBe("0-9");
  });

  it("focuses by bucket (group-x) and labels the tooltip with the test count", () => {
    const definition = buildHistogramChartDefinition(rows);

    expect(definition.focus).toEqual("group-x");

    const scene = createChartScene(definition as never, {
      width: 800,
      height: 200,
    });

    const content = definition.tooltip?.content;
    expect(content).toBeDefined();
    // the focused points for a group-x hover: the one bar under the pointer
    const focusedPoint = scene.points[2];
    expect(focusedPoint).toBeDefined();
    const result = content?.([focusedPoint as never]);

    expect(result).toBeDefined();
    expect(result?.title).toBe(rows[2]?.label);
    expect(result?.rows[0]?.label).toBe("Tests:");
    expect(result?.rows[0]?.value).toBe("12");
  });
});

describe("HistogramChart", () => {
  const results = [
    { wpm: 12.5 },
    { wpm: 18 },
    { wpm: 21 },
    { wpm: 33.2 },
  ] as NormalizedLocalResult<Mode>[];

  const unit = getTypingSpeedUnit("wpm");

  afterEach(() => {
    setUseTanstackCharts(false);
  });

  it("renders the Chart.js half by default", () => {
    const { getByTestId, queryByTestId } = render(() => (
      <HistogramChart results={results} typingSpeedUnit={unit} />
    ));

    expect(getUseTanstackCharts()).toBe(false);
    expect(getByTestId("chartjs")).not.toBeNull();
    expect(queryByTestId("tanstack-chart")).toBeNull();
  });

  it("renders the TanStack half when the parity flag is on", () => {
    setUseTanstackCharts(true);

    const { getByTestId, queryByTestId } = render(() => (
      <HistogramChart results={results} typingSpeedUnit={unit} />
    ));

    expect(getUseTanstackCharts()).toBe(true);
    expect(getByTestId("tanstack-chart")).not.toBeNull();
    expect(queryByTestId("chartjs")).toBeNull();
  });
});
