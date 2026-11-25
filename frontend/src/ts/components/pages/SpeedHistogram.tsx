import { barY, type ChartTooltipRow, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Chart } from "@tanstack/charts/solid";
import { tooltip } from "@tanstack/charts/tooltip";
import { createMemo, JSXElement, Show } from "solid-js";

import { Theme } from "../../constants/themes";
import { getUseTanstackCharts } from "../../dev/chart-parity";
import { getTheme } from "../../theme/state";
import { ChartJs } from "../common/ChartJs";

export type SpeedHistogramData = {
  labels: string[];
  data: { x: number; y: number; topPercentage?: string }[];
};

type SpeedHistogramRow = {
  label: string;
  count: number;
  topPercentage?: string;
};

/**
 * The about page speed histogram: leaderboard users per 10 wpm bucket.
 * Renders the Chart.js half by default; the dev-only parity flag
 * (dev/chart-parity) switches to the TanStack implementation.
 */
export function SpeedHistogram(props: {
  data: SpeedHistogramData | undefined;
}): JSXElement {
  const rows = createMemo<SpeedHistogramRow[]>(() =>
    (props.data?.data ?? []).map((it, i) => ({
      label: props.data?.labels[i] ?? `${it.x} - ${it.x + 9}`,
      count: it.y,
      topPercentage: it.topPercentage,
    })),
  );

  const definition = createMemo(() =>
    buildSpeedHistogramDefinition(rows(), getTheme),
  );

  return (
    <Show
      when={getUseTanstackCharts()}
      fallback={
        // Stepping stone: replaced by the TanStack implementation; removed in S12
        <ChartJs
          name="SpeedHistogram"
          type="bar"
          data={{
            labels: props.data?.labels ?? [],
            datasets: [
              {
                yAxisID: "count",
                label: "Users",
                data: props.data?.data ?? [],
                minBarLength: 2,
                backgroundColor: getTheme().main,
                borderColor: getTheme().main,
              },
            ],
          }}
          options={{
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
                callbacks: {
                  afterLabel: (context) => {
                    return (
                      (context.raw as { topPercentage?: string })
                        .topPercentage ?? ""
                    );
                  },
                },
              },
            },
          }}
        />
      }
    >
      <Chart
        definition={definition()}
        ariaLabel="Distribution of time 60 leaderboard results"
        // the host defaults to a fixed 320 px; follow the section like the canvas does
        style={{ height: "100%" }}
      />
    </Show>
  );
}

/**
 * The TanStack definition of the speed histogram: one bar per bucket over a
 * band x scale and a zero-based linear y scale; a group-x tooltip keeps the
 * bucket label, the user count and the cumulative top percentage.
 * Pure: asserted in __tests__/components/pages/SpeedHistogram.spec.tsx.
 */
export function buildSpeedHistogramDefinition(
  rows: SpeedHistogramRow[],
  theme: () => Theme,
) {
  const counts = rows.map((it) => it.count);
  const max = Math.max(1, ...counts);
  // chart.js minBarLength: 2 keeps the tiny tail buckets visible; the library
  // has no minimum bar size, so clamp in count space. Calibrated against the
  // ~120 px painted plot (192 px section minus the rotated-label margin): the
  // nice'd domain max sits above the raw max, so the divisor is smaller than
  // the plot height to land at 2 px. The tooltip reads datum.count, unclamped.
  const minVisibleCount = (2 / 92) * max;

  return defineChart({
    marks: [
      barY(rows, {
        x: "label",
        y: (it) => Math.max(it.count, minVisibleCount),
        fill: theme().main,
      }),
    ],
    scales: {
      x: {
        scale: () =>
          scaleBand()
            .domain(rows.map((it) => it.label))
            .padding(0.28),
        grid: { stroke: theme().sub },
        axis: { tickLabels: { rotate: -45 } },
      },
      y: {
        scale: () => scaleLinear(),
        nice: true,
        grid: { stroke: theme().sub },
        axis: { label: "Users" },
      },
    },
    tooltip: {
      use: tooltip,
      // the old tooltip animated 250 ms between bars
      motion: { type: "tween", duration: 250, easing: "ease-out" },
      // the old tooltip: bucket title, a user-count row, and the cumulative
      // top percentage when the bucket has one
      content: (points) => {
        const point = points[0];
        if (!point) return { rows: [] };
        // the y channel is clamped for the minimum bar size; the true count
        // lives on the datum
        // Chart.js painted "Users: 7" as one left-aligned line; the built-in
        // row is a swatch | label | value grid, so the whole line goes in the label
        const tooltipRows: ChartTooltipRow[] = [
          {
            label: `Users: ${point.datum.count}`,
            value: "",
            color: point.color,
          },
        ];
        if (point.datum.topPercentage !== undefined) {
          tooltipRows.push({ label: point.datum.topPercentage, value: "" });
        }
        return {
          title: point.datum.label,
          rows: tooltipRows,
        };
      },
    },
  });
}
