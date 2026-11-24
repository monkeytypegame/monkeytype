import { barY, defineChart } from "@tanstack/charts";
import { focusGroupX } from "@tanstack/charts/focus";
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

  return defineChart({
    marks: [
      barY(rows, {
        x: "label",
        y: "count",
        fill: theme().main,
      }),
    ],
    scales: {
      x: {
        scale: () =>
          scaleBand()
            .domain(rows.map((it) => it.label))
            .padding(0.28),
        // Chart.js painted these with subAlt
        grid: { stroke: "var(--sub-alt-color)" },
      },
      y: {
        scale: () => scaleLinear().domain([0, max]),
        // Chart.js beginAtZero + stepSize 10: nice ticks from zero
        nice: true,
        grid: { stroke: "var(--sub-alt-color)" },
        axis: { label: "Users" },
      },
    },
    // Chart.js `mode: "index"`: the whole bucket column responds, anywhere in it
    focus: focusGroupX,
    maxFocusDistance: Number.POSITIVE_INFINITY,
    tooltip: {
      use: tooltip,
      items: [
        { channel: "y", label: "Users" },
        // the old afterLabel line, omitted for buckets without one
        {
          id: "topPercentage",
          text: (point) => point.datum.topPercentage ?? null,
        },
      ],
    },
  });
}
