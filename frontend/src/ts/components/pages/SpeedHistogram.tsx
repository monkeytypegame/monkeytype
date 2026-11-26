import { barY, type ChartTooltipRow, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Chart } from "@tanstack/charts/solid";
import { tooltip } from "@tanstack/charts/tooltip";
import { createMemo, JSXElement, Show } from "solid-js";

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

  const definition = createMemo(() => buildSpeedHistogramDefinition(rows()));

  return (
    <Show
      when={getUseTanstackCharts()}
      fallback={
        // TanStack renderer is the default; the fallback renders when the flag is off
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
        // responsive per the TanStack guide: no width (the host follows the
        // container; initialWidth seeds the first frame until the measured
        // width is available) and a fixed height, like the h-48 section
        height={192}
        initialWidth={640}
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
export function buildSpeedHistogramDefinition(rows: SpeedHistogramRow[]) {
  const counts = rows.map((it) => it.count);
  const max = Math.max(1, ...counts);
  // no library minimum bar size: clamp tiny bars to a 2px minimum; zero stays zero
  const minVisibleCount = (2 / 92) * max;

  return defineChart({
    marks: [
      barY(rows, {
        x: "label",
        y: (it) => Math.max(it.count, it.count === 0 ? 0 : minVisibleCount),
      }),
    ],
    scales: {
      x: {
        scale: () =>
          scaleBand()
            .domain(rows.map((it) => it.label))
            .padding(0.28),
        grid: true,
        axis: { tickLabels: { rotate: -45 } },
      },
      y: {
        scale: () => scaleLinear(),
        nice: true,
        grid: true,
        axis: {
          label: "Users",
        },
      },
    },
    tooltip: {
      use: tooltip,
      content: (points) => {
        const point = points[0];
        if (!point) return { rows: [] };
        // y channel is clamped for the min bar size; the true count lives on the datum
        // swatch | label | value grid: the whole line goes in the label
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
