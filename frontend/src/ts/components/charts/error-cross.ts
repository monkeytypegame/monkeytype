import { createMark } from "@tanstack/charts";
import type {
  Channel,
  ChartKey,
  ChartMark,
  ChartPoint,
  ChartValue,
  OptionScaleId,
  ResolvedScale,
  SceneGroup,
  SceneNode,
  SceneRule,
  SceneStyle,
} from "@tanstack/charts";
/**
 * A rotated-cross error marker (tanstack-charts S2): the TanStack half of the
 * Chart.js `pointStyle: "crossRot"` error datasets, shared by the mini result
 * (S6) and result (S9) charts.
 *
 * Chart.js draws a constant-pixel cross per point (`pointRadius` scales the
 * arms) and hides it when the value is zero or below (`pointRadius: 0`),
 * while the point keeps participating in the index-mode tooltip. This mark
 * does the same: two constant-pixel rule arms rotated 45° (a plain `+` would
 * be Chart.js "cross"), one interaction point per row, no arms when the
 * value is not positive.
 *
 * The geometry is scene nodes rather than a composition of ordinary marks
 * (no built-in mark draws short free-standing segments), so it is a
 * `createMark`, not a `compositeMark`.
 */
export type ErrorCrossOptions<TDatum> = {
  /** Stable mark id. Defaults to a layer-derived `error-cross-<n>`. */
  id?: string;
  /** Stable identity per row. Defaults to the x value, then the row index. */
  key?: Channel<TDatum, ChartKey | null | undefined>;
  /** Horizontal position, eg. the second. Defaults to the row index. */
  x?: Channel<TDatum, ChartValue | null | undefined>;
  /** The error count. A non-positive count paints no arms but keeps the point. */
  y: Channel<TDatum, number | null | undefined>;
  /** Arm paint, eg. the theme error colour. */
  color: string;
  /**
   * Arm length in pixels, centre to tip along the diagonal. Defaults to 3,
   * the Chart.js `pointRadius` both error datasets used.
   */
  size?: number;
  /** Arm stroke width. Defaults to 2, the Chart.js dataset `borderWidth`. */
  strokeWidth?: number;
};

/** Reads a channel (field name or accessor) for one row, else the fallback. The built-in marks use the same pattern with their unexported internal helpers. */
function channelValue<TDatum, TValue>(
  datum: TDatum,
  index: number,
  data: readonly TDatum[],
  channel: Channel<TDatum, TValue> | undefined,
  fallback: (index: number) => TValue,
): TValue {
  if (channel === undefined) return fallback(index);
  if (typeof channel === "function") return channel(datum, { index, data });
  return (datum as Record<PropertyKey, unknown>)[channel as string] as TValue;
}

// the built-in marks' internal value guards (not exported from the package)
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isChartValue(value: unknown): value is ChartValue {
  return (
    isFiniteNumber(value) || typeof value === "string" || value instanceof Date
  );
}

/**
 * The scale id the mark's phantom type carries for a binding: the caller's
 * literal when present, else the reserved scale id - the built-in marks'
 * `OptionScaleId` semantics, so an unbound mark owns the reserved scale in
 * its type.
 */
type ErrorCrossXScaleId<
  TDatum,
  TXScaleId extends string | undefined,
  TYScaleId extends string | undefined,
> = OptionScaleId<
  ErrorCrossOptions<TDatum> & { xScale?: TXScaleId; yScale?: TYScaleId },
  "xScale",
  "x"
>;
type ErrorCrossYScaleId<
  TDatum,
  TXScaleId extends string | undefined,
  TYScaleId extends string | undefined,
> = OptionScaleId<
  ErrorCrossOptions<TDatum> & { xScale?: TXScaleId; yScale?: TYScaleId },
  "yScale",
  "y"
>;

/**
 * The error cross mark. Each row carries one error count; the x channel
 * positions the row (eg. the second) and the y channel binds the count to
 * the chart's error scale (named via `yScale`, as the built-in marks do).
 */
export function errorCross<
  TDatum,
  const TXScaleId extends string | undefined = undefined,
  const TYScaleId extends string | undefined = undefined,
>(
  source: readonly TDatum[],
  options: ErrorCrossOptions<TDatum> & {
    xScale?: TXScaleId;
    yScale?: TYScaleId;
  },
): ChartMark<
  TDatum,
  ChartValue,
  number,
  ChartValue,
  number,
  ErrorCrossXScaleId<TDatum, TXScaleId, TYScaleId>,
  ErrorCrossYScaleId<TDatum, TXScaleId, TYScaleId>
> {
  const xScaleId = options.xScale ?? "x";
  const yScaleId = options.yScale ?? "y";
  const color = options.color;
  const size = options.size ?? 3;
  const strokeWidth = options.strokeWidth ?? 2;

  return createMark<
    TDatum,
    ChartValue,
    number,
    ErrorCrossXScaleId<TDatum, TXScaleId, TYScaleId>,
    ErrorCrossYScaleId<TDatum, TXScaleId, TYScaleId>
  >(({ markIndex }) => {
    const id = options.id ?? `error-cross-${markIndex}`;
    // the tip sits `size` px from the centre along the 45° diagonal
    const arm = size / Math.SQRT2;
    const style: SceneStyle = { stroke: color, strokeWidth };

    const xValues = source.map((datum, index) =>
      channelValue(datum, index, source, options.x, (i) => i),
    );
    const yValues = source.map((datum, index) =>
      channelValue(datum, index, source, options.y, () => undefined),
    );
    const keys = source.map((datum, index) => {
      const key = channelValue(
        datum,
        index,
        source,
        options.key,
        () => undefined,
      );
      return key ?? xValues[index] ?? index;
    });

    return {
      id,
      channels: {
        x: { scale: xScaleId, values: xValues.filter(isChartValue) },
        y: { scale: yScaleId, values: yValues.filter(isFiniteNumber) },
      },
      render({ scales }) {
        const xScale: ResolvedScale | undefined = scales[xScaleId];
        const yScale: ResolvedScale | undefined = scales[yScaleId];
        if (!xScale || !yScale) return { nodes: [] };

        const rules: SceneRule[] = [];
        const points: ChartPoint<TDatum, ChartValue, number>[] = [];

        source.forEach((datum, index) => {
          const xValue = xValues[index];
          // an invalid row is skipped entirely, like a built-in mark
          if (!isChartValue(xValue)) return;
          const raw = yValues[index];
          const value = isFiniteNumber(raw) ? raw : 0;
          const x = xScale.map(xValue);
          const y = yScale.map(value);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return;

          const key = `${id}:${String(keys[index])}`;
          const point: ChartPoint<TDatum, ChartValue, number> = {
            key,
            markId: id,
            group: null,
            groupLabel: id,
            datum,
            datumIndex: index,
            xValue,
            yValue: value,
            x,
            y,
            color,
          };
          // the point is emitted for every row: chart.js painted zero-value
          // errors at radius 0 (invisible) but still listed them in the
          // index-mode tooltip
          points.push(point);
          if (value <= 0) return;

          rules.push(
            {
              kind: "rule",
              key: `${key}:a`,
              x1: x - arm,
              y1: y - arm,
              x2: x + arm,
              y2: y + arm,
              style,
              interaction: { point, affinity: "xy" },
            },
            {
              kind: "rule",
              key: `${key}:b`,
              x1: x - arm,
              y1: y + arm,
              x2: x + arm,
              y2: y - arm,
              style,
            },
          );
        });

        const nodes: SceneNode[] = [
          {
            kind: "group",
            key: id,
            className: "ts-chart__error-cross",
            ariaHidden: true,
            children: rules,
          } satisfies SceneGroup,
        ];
        return { nodes, points };
      },
    };
  });
}
