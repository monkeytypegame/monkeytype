import { scaleLinear } from "@tanstack/charts/scales/linear";
import { defineChart } from "@tanstack/charts";
import { createChartScene } from "@tanstack/charts/scene";
import { describe, expect, it, vi } from "vitest";

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

import type { SceneGroup, SceneNode } from "@tanstack/charts";
import {
  errorCross,
  type ErrorCrossOptions,
} from "../../../src/ts/components/charts/error-cross";

type ErrorRow = {
  second: number;
  err: number;
};

const rows: ErrorRow[] = [
  { second: 1, err: 0 },
  { second: 2, err: 0 },
  { second: 3, err: 3 },
  { second: 4, err: 0 },
  { second: 5, err: 2 },
];

const COLOR = "#ff0000";

const definition = defineChart({
  marks: [
    errorCross(rows, {
      x: "second",
      y: "err",
      color: COLOR,
    } satisfies ErrorCrossOptions<ErrorRow>),
  ],
  scales: {
    x: { scale: () => scaleLinear() },
    y: { scale: () => scaleLinear() },
  },
});

const scene = createChartScene(definition as never, {
  width: 800,
  height: 200,
});

function markGroup(node: SceneNode): SceneGroup | undefined {
  if (node.kind !== "group") return undefined;
  if (node.className === "ts-chart__error-cross") return node;
  for (const child of node.children) {
    const found = markGroup(child);
    if (found) return found;
  }
  return undefined;
}

const group = scene.nodes.map(markGroup).find((it) => it !== undefined);

describe("errorCross", () => {
  it("binds the error counts to the y scale", () => {
    const yDomain = scene.scales["y"]?.domain as readonly number[];
    expect(yDomain).toEqual([0, 3]);
    const xDomain = scene.scales["x"]?.domain as readonly number[];
    expect(xDomain).toEqual([1, 5]);
  });

  it("emits one point per row, zero errors included", () => {
    const points = scene.points.filter((point) => point.color === COLOR);
    expect(points.map((point) => point.yValue)).toEqual([0, 0, 3, 0, 2]);
    expect(points.map((point) => point.xValue)).toEqual([1, 2, 3, 4, 5]);
    // stable keys, one per row
    expect(points.map((point) => point.key).sort()).toEqual(
      [...points.map((point) => point.key)].sort(),
    );
    expect(new Set(points.map((point) => point.key)).size).toBe(5);
    // every point sits on its row
    expect(points.every((point) => Number.isFinite(point.x))).toBe(true);
    expect(points.every((point) => Number.isFinite(point.y))).toBe(true);
  });

  it("paints a rotated cross per positive error and nothing for zero", () => {
    expect(group?.kind).toBe("group");
    const rules = (group?.children ?? []).filter(
      (node) => node.kind === "rule",
    );
    // rows 3 and 5 have errors; each paints two arms
    expect(rules.length).toBe(4);

    const yScale = scene.scales["y"];
    const xScale = scene.scales["x"];
    if (!yScale || !xScale) throw new Error("scales missing");
    const x3 = xScale.map(3);
    const y3 = yScale.map(3);
    const arm = 3 / Math.SQRT2;

    const first = rules[0];
    expect(first?.kind).toBe("rule");
    if (first?.kind === "rule") {
      expect(first.x1).toBeCloseTo(x3 - arm);
      expect(first.y1).toBeCloseTo(y3 - arm);
      expect(first.x2).toBeCloseTo(x3 + arm);
      expect(first.y2).toBeCloseTo(y3 + arm);
      expect(first.style?.stroke).toBe(COLOR);
      expect(first.style?.strokeWidth).toBe(2);
    }
    // the second arm is the other diagonal
    const second = rules[1];
    if (second?.kind === "rule") {
      expect(second.x1).toBeCloseTo(x3 - arm);
      expect(second.y1).toBeCloseTo(y3 + arm);
      expect(second.x2).toBeCloseTo(x3 + arm);
      expect(second.y2).toBeCloseTo(y3 - arm);
    }
    // the zero rows paint nothing
    const y0 = yScale.map(0);
    const onZeroRows = rules.filter((node) => {
      if (node.kind !== "rule") return false;
      return Math.abs(node.y1 - y0) < 1e-9 && Math.abs(node.y2 - y0) < 1e-9;
    });
    expect(onZeroRows).toEqual([]);
  });

  it("binds to a named error scale when given", () => {
    const named = defineChart({
      marks: [
        errorCross(rows, {
          x: "second",
          y: "err",
          yScale: "error",
          color: COLOR,
        }),
      ],
      scales: {
        x: { scale: () => scaleLinear() },
        // the mark binds its y channel to the named scale, so the reserved
        // y scale is dormant
        y: null,
        error: {
          scale: () => scaleLinear(),
          channel: "y",
          side: "right",
        },
      },
    });

    const scene = createChartScene(named as never, {
      width: 800,
      height: 200,
    });

    const errorDomain = scene.scales["error"]?.domain as readonly number[];
    expect(errorDomain).toEqual([0, 3]);
    const errorScale = scene.scales["error"];
    if (!errorScale) throw new Error("error scale missing");
    const y0 = errorScale.map(0);
    const y3 = errorScale.map(3);
    const y2 = errorScale.map(2);
    const points = scene.points.filter((point) => point.color === COLOR);
    expect(points.map((point) => point.y)).toEqual([y0, y0, y3, y0, y2]);
  });
});
