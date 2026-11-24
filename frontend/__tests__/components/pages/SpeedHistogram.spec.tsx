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
import { Theme } from "../../../src/ts/constants/themes";
import {
  getUseTanstackCharts,
  setUseTanstackCharts,
} from "../../../src/ts/dev/chart-parity";

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

const data: SpeedHistogramData = {
  labels: ["80 - 89", "90 - 99", "100 - 109", "110 - 119"],
  data: [
    { x: 80, y: 4, topPercentage: "top 99.50%" },
    { x: 90, y: 12, topPercentage: "top 97.00%" },
    { x: 100, y: 148, topPercentage: "top 85.00%" },
    { x: 110, y: 0 },
  ],
};

const rows = data.data.map((it, i) => ({
  label: data.labels[i] ?? `${it.x} - ${it.x + 9}`,
  count: it.y,
  topPercentage: it.topPercentage,
}));

describe("buildSpeedHistogramDefinition", () => {
  it("places every bucket on the x scale and counts on a zero-based y scale", () => {
    const definition = buildSpeedHistogramDefinition(rows, theme);

    const scene = createChartScene(definition as never, {
      width: 800,
      height: 200,
    });

    expect(scene.scales["x"]?.domain).toEqual([
      "80 - 89",
      "90 - 99",
      "100 - 109",
      "110 - 119",
    ]);
    const yDomain = scene.scales["y"]?.domain as [number, number] | undefined;
    expect(yDomain?.[0]).toBe(0);
    expect(yDomain?.[1]).toBe(150);
  });

  it("keeps one bar per row with the theme's main color", () => {
    const definition = buildSpeedHistogramDefinition(rows, theme);

    const scene = createChartScene(definition as never, {
      width: 800,
      height: 200,
    });

    expect(scene.points.map((point) => point.yValue)).toEqual([4, 12, 148, 0]);
    expect(scene.points[0]?.xValue).toBe("80 - 89");
    expect(scene.points[0]?.color).toBe("#222222");
  });
});

describe("SpeedHistogram", () => {
  afterEach(() => {
    setUseTanstackCharts(false);
  });

  it("renders the Chart.js half by default", () => {
    const { getByTestId, queryByTestId } = render(() => (
      <SpeedHistogram data={data} />
    ));

    expect(getUseTanstackCharts()).toBe(false);
    expect(getByTestId("chartjs")).not.toBeNull();
    expect(queryByTestId("tanstack-chart")).toBeNull();
  });

  it("renders the TanStack half when the parity flag is on", () => {
    setUseTanstackCharts(true);

    const { getByTestId, queryByTestId } = render(() => (
      <SpeedHistogram data={data} />
    ));

    expect(getUseTanstackCharts()).toBe(true);
    expect(getByTestId("tanstack-chart")).not.toBeNull();
    expect(queryByTestId("chartjs")).toBeNull();
  });
});
