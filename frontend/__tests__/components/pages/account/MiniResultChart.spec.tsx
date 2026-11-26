import { render } from "@solidjs/testing-library";
import { createChartScene } from "@tanstack/charts/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
// the single result comes from a db query; the spec feeds fixed chart data
vi.mock("@tanstack/solid-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/solid-query")>();
  return {
    ...actual,
    // the solid useQuery result is a store backed by a proxy: after the fetch
    // resolves, `data` is the plain value (the AsyncContent reads it that way)
    useQuery: () =>
      ({
        data: (globalThis as { __mockResult?: { chartData: ChartData } })
          .__mockResult,
        isLoading: false,
        isError: false,
        error: undefined,
      }) as never,
  };
});
// the results collection imports the typing state, which fetches layouts the
// jsdom environment can't resolve; the spec only needs the options factory
vi.mock("../../../../src/ts/collections/results", () => ({
  getSingleResultQueryOptions: () => ({
    queryKey: ["mock-result"],
    queryFn: async () => ({}),
  }),
}));

import type { ChartData } from "@monkeytype/schemas/results";
import type { SceneNode } from "@tanstack/charts";

import {
  buildMiniResultChartDefinition,
  MiniResultChart,
} from "../../../../src/ts/components/pages/account/MiniResultChart";
import { Theme } from "../../../../src/ts/constants/themes";
import {
  getUseTanstackCharts,
  setUseTanstackCharts,
} from "../../../../src/ts/dev/chart-parity";
import { hideModal, showModal } from "../../../../src/ts/states/modals";
import { get as getTypingSpeedUnit } from "../../../../src/ts/utils/typing-speed-units";

// the chart data comes in wpm; the unit conversion applies in the definition
const mockChart: ChartData = {
  wpm: [50, 60, 55, 70, 65],
  burst: [60, 70, 66, 84, 78],
  err: [0, 1, 0, 3, 0],
};

const theme = (): Theme =>
  ({
    name: "mock",
    main: "#444444",
    sub: "#222222",
    subAlt: "#111111",
    custom: "#333333",
    error: "#cc0000",
    background: "#000000",
  }) as unknown as Theme;

describe("buildMiniResultChartDefinition", () => {
  const wpm = getTypingSpeedUnit("wpm");

  const scene = (beginAtZero: boolean): ReturnType<typeof createChartScene> =>
    createChartScene(
      buildMiniResultChartDefinition(mockChart, theme, beginAtZero, wpm),
      { width: 800, height: 240 },
    );

  it("declares a left speed scale and a right error scale", () => {
    const definition = buildMiniResultChartDefinition(
      mockChart,
      theme,
      true,
      wpm,
    );
    expect(definition.scales.y?.side).toBe("left");
    expect(definition.scales.error?.side).toBe("right");
  });

  it("binds the per-second wpm and burst speeds to the left scale", () => {
    const { scales, points } = scene(true);
    const yScale = scales["y"] as { map: (v: number) => number } | undefined;
    expect(yScale).toBeDefined();

    const wpmPoint = points.find((it) => it.markId === "wpm");
    expect(wpmPoint?.x).toBe(
      (scales["x"] as { map: (v: number) => number }).map(1),
    );
    expect(wpmPoint?.y).toBe(
      (yScale as { map: (v: number) => number }).map(50),
    );
    const burstPoint = points.find((it) => it.markId === "burst");
    expect(burstPoint?.y).toBe(
      (yScale as { map: (v: number) => number }).map(60),
    );
  });

  it("binds the error counts to the right scale", () => {
    const { scales, points } = scene(true);
    const errorScale = scales["error"] as
      | { map: (v: number) => number }
      | undefined;
    expect(errorScale).toBeDefined();

    const errorPoint = points.find(
      (it) => it.markId === "errors" && it.yValue === 1,
    );
    expect(errorPoint?.y).toBe(
      (errorScale as { map: (v: number) => number }).map(1),
    );
  });

  it("follows beginAtZero on both value scales", () => {
    // a fixture without zero errors, so the error scale's fit is observable
    const positiveErr: ChartData = { ...mockChart, err: [2, 1, 4, 3, 5] };
    const build = (
      beginAtZero: boolean,
    ): ReturnType<typeof createChartScene>["scales"] =>
      createChartScene(
        buildMiniResultChartDefinition(positiveErr, theme, beginAtZero, wpm),
        { width: 800, height: 240 },
      ).scales;

    const zeroed = build(true);
    const zeroedY = zeroed["y"]?.domain as [number, number];
    const zeroedError = zeroed["error"]?.domain as [number, number];
    expect(zeroedY).toEqual([0, 84]);
    expect(zeroedError).toEqual([0, 5]);

    const free = build(false);
    const freeY = free["y"]?.domain as [number, number];
    const freeError = free["error"]?.domain as [number, number];
    expect(freeY[0]).toBe(50);
    expect(freeY[1]).toBeGreaterThanOrEqual(84);
    expect(freeError[0]).toBe(1);
    expect(freeError[1]).toBeGreaterThanOrEqual(5);
  });

  it("renders all-zero chart data without crashing (the zero viewports are skipped)", () => {
    const zeroChart: ChartData = { wpm: [0, 0], burst: [0, 0], err: [0, 0] };

    // the library rejects a [0, 0] viewport domain; the fitted scales handle
    // the zero content instead
    const scene = createChartScene(
      buildMiniResultChartDefinition(zeroChart, theme, true, wpm),
      { width: 800, height: 240 },
    );
    const y = scene.scales["y"]?.domain as [number, number];
    const error = scene.scales["error"]?.domain as [number, number];
    expect(y[0]).toBe(0);
    expect(y[1]).toBeGreaterThanOrEqual(1);
    expect(error[1]).toBeGreaterThanOrEqual(1);
  });

  it("draws a constant-size cross per positive error and keeps zero-error points", () => {
    const { nodes, points } = scene(true);

    const flatten = (node: SceneNode): SceneNode[] => [
      node,
      ...(node.kind === "group" ? node.children : []).flatMap(flatten),
    ];
    const all = nodes.flatMap(flatten);
    const arms = all.filter(
      (it) => it.kind === "rule" && it.key.startsWith("errors"),
    );
    // two arms per positive error, none for the zero rows
    expect(arms.length).toBe(4);

    // the tooltip point is emitted for every row, zero errors included
    const errorPoints = points.filter((it) => it.markId === "errors");
    expect(errorPoints.length).toBe(5);
  });

  it("tooltips per second over all three series, like the chart.js index mode", () => {
    const definition = buildMiniResultChartDefinition(
      mockChart,
      theme,
      true,
      wpm,
    );
    expect(definition.focus).toEqual("group-x");

    const { points } = scene(true);
    const wpmPoint = points.find(
      (it) => it.markId === "wpm" && it.xValue === 2,
    );
    expect(wpmPoint).toBeDefined();

    const result = definition.tooltip?.content?.([wpmPoint as never]);
    expect(result?.title).toBe("2");
    const rows = (result?.rows ?? []).map((row) => row.label);
    expect(rows).toEqual(["2: 60", "2: 70", "2: 1"]);
    // each row carries its series' paint, like the chart.js colour boxes
    const colors = (result?.rows ?? []).map((row) => row.color);
    expect(colors).toEqual(["#444444", "#222222", "#cc0000"]);
  });
});

describe("MiniResultChart", () => {
  beforeEach(() => {
    showModal("MiniResultChartModal");
    // jsdom has no <dialog> methods
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    (globalThis as { __mockResult?: { chartData: ChartData } }).__mockResult = {
      chartData: mockChart,
    };
  });

  afterEach(() => {
    hideModal("MiniResultChartModal");
    setUseTanstackCharts(false);
  });

  it("renders the Chart.js half by default", () => {
    const { getByTestId, queryByTestId } = render(() => (
      <MiniResultChart resultId="mock-result" />
    ));

    expect(getUseTanstackCharts()).toBe(false);
    expect(getByTestId("chartjs")).not.toBeNull();
    expect(queryByTestId("tanstack-chart")).toBeNull();
  });

  it("renders the TanStack half when the parity flag is on", () => {
    setUseTanstackCharts(true);

    const { getByTestId, queryByTestId } = render(() => (
      <MiniResultChart resultId="mock-result" />
    ));

    expect(getUseTanstackCharts()).toBe(true);
    expect(getByTestId("tanstack-chart")).not.toBeNull();
    expect(queryByTestId("chartjs")).toBeNull();
  });
});
