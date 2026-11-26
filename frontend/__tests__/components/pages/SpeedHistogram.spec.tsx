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
// no canvas in jsdom - render test markers via the mocks
vi.mock("../../../src/ts/components/common/ChartJs", () => ({
  ChartJs: () => <div data-testid="chartjs" />,
}));
vi.mock("@tanstack/charts/solid", () => ({
  Chart: (props: { ariaLabel?: string }) => (
    <div data-testid="tanstack-chart" aria-label={props.ariaLabel} />
  ),
}));

import {
  buildSpeedHistogramDefinition,
  SpeedHistogram,
  type SpeedHistogramData,
} from "../../../src/ts/components/pages/SpeedHistogram";
import {
  getUseTanstackCharts,
  setUseTanstackCharts,
} from "../../../src/ts/dev/chart-parity";

const data: SpeedHistogramData = {
  labels: ["80 - 89", "90 - 99", "100 - 109", "110 - 119", "120 - 129"],
  data: [
    { x: 80, y: 4, topPercentage: "top 99.50%" },
    { x: 90, y: 12, topPercentage: "top 97.00%" },
    { x: 100, y: 148, topPercentage: "top 85.00%" },
    { x: 110, y: 1 },
    { x: 120, y: 0 },
  ],
};

const rows = data.data.map((it, i) => ({
  label: data.labels[i] ?? `${it.x} - ${it.x + 9}`,
  count: it.y,
  topPercentage: it.topPercentage,
}));

describe("buildSpeedHistogramDefinition", () => {
  it("places every bucket on the x scale and counts on a zero-based y scale", () => {
    const definition = buildSpeedHistogramDefinition(rows);

    const scene = createChartScene(definition as never, {
      width: 800,
      height: 200,
    });

    expect(scene.scales["x"]?.domain).toEqual([
      "80 - 89",
      "90 - 99",
      "100 - 109",
      "110 - 119",
      "120 - 129",
    ]);
    const yDomain = scene.scales["y"]?.domain as [number, number] | undefined;
    expect(yDomain?.[0]).toBe(0);
    expect(yDomain?.[1]).toBe(150);
  });

  it("keeps one bar per row; tiny buckets get a 2px minimum, zero stays zero", () => {
    const definition = buildSpeedHistogramDefinition(rows);

    const scene = createChartScene(definition as never, {
      width: 800,
      height: 200,
    });

    // tiny bucket clamped to a 2px minimum; zero bucket stays zero
    expect(scene.points.map((point) => point.yValue)).toEqual([
      4,
      12,
      148,
      (2 / 92) * 148,
      0,
    ]);
    expect(scene.points[0]?.xValue).toBe("80 - 89");
  });
});

describe("SpeedHistogram", () => {
  afterEach(() => {
    setUseTanstackCharts(false);
  });

  it("renders the fallback renderer when the parity flag is off", () => {
    const { getByTestId, queryByTestId } = render(() => (
      <SpeedHistogram data={data} />
    ));

    expect(getUseTanstackCharts()).toBe(false);
    expect(getByTestId("chartjs")).not.toBeNull();
    expect(queryByTestId("tanstack-chart")).toBeNull();
  });

  it("renders the TanStack chart when the parity flag is on", () => {
    setUseTanstackCharts(true);

    const { getByTestId, queryByTestId } = render(() => (
      <SpeedHistogram data={data} />
    ));

    expect(getUseTanstackCharts()).toBe(true);
    expect(getByTestId("tanstack-chart")).not.toBeNull();
    expect(queryByTestId("chartjs")).toBeNull();
  });
});
