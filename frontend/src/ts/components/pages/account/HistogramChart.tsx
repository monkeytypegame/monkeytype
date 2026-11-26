import { Mode } from "@monkeytype/schemas/shared";
import { barY, type ChartTooltipRow, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Chart } from "@tanstack/charts/solid";
import { tooltip } from "@tanstack/charts/tooltip";
import { createMemo, JSXElement, Show } from "solid-js";

import type { NormalizedLocalResult } from "../../../collections/results";

import { getUseTanstackCharts } from "../../../dev/chart-parity";
import { getTheme } from "../../../theme/state";
import { TypingSpeedUnitSettings } from "../../../utils/typing-speed-units";
import { ChartJs } from "../../common/ChartJs";

export type HistogramChartRow = {
  label: string;
  count: number;
};

/**
 * The account page speed histogram: the user's results per speed bucket.
 * Renders the Chart.js half by default; the dev-only parity flag
 * (dev/chart-parity) switches to the TanStack implementation.
 */
export function HistogramChart(props: {
  results: NormalizedLocalResult<Mode>[];
  typingSpeedUnit: TypingSpeedUnitSettings;
}): JSXElement {
  const buckets = createMemo<HistogramChartRow[]>(() =>
    groupIntoBuckets(
      props.results.map((it) => props.typingSpeedUnit.fromWpm(it.wpm)),
      props.typingSpeedUnit.histogramDataBucketSize,
    ),
  );

  const definition = createMemo(() => buildHistogramChartDefinition(buckets()));

  return (
    <div class="h-50">
      <Show
        when={getUseTanstackCharts()}
        fallback={
          // Stepping stone: replaced by the TanStack implementation; removed in S12
          <ChartJs
            name="Histogram"
            type="bar"
            data={{
              datasets: [
                {
                  label: "Tests",
                  data: buckets().map((it) => ({
                    x: it.label,
                    y: it.count,
                  })),
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
                },
                y: {
                  axis: "y",
                  beginAtZero: true,
                  ticks: {
                    autoSkip: true,
                    autoSkipPadding: 20,
                    stepSize: 10,
                  },
                  display: true,
                  title: {
                    display: true,
                    text: "Tests",
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
                },
              },
            }}
          />
        }
      >
        <Chart
          definition={definition()}
          ariaLabel="Distribution of your test speeds"
          // responsive per the TanStack guide: no width (the host follows the
          // container; initialWidth seeds the first frame until the measured
          // width is available) and a fixed height, like the 200 px wrapper
          // and the canvas it replaces
          height={200}
          initialWidth={640}
        />
      </Show>
    </div>
  );
}

/**
 * The TanStack definition of the account histogram: one bar per bucket over a
 * band x scale and a zero-based linear y scale; a group-x tooltip shows the
 * bucket label and the test count. Pure: asserted in
 * __tests__/components/pages/account/HistogramChart.spec.tsx.
 */
export function buildHistogramChartDefinition(rows: HistogramChartRow[]) {
  return defineChart({
    marks: [
      barY(rows, {
        x: "label",
        y: "count",
      }),
    ],
    scales: {
      x: {
        scale: () =>
          scaleBand()
            .domain(rows.map((it) => it.label))
            .padding(0.28),
      },
      y: {
        scale: () => scaleLinear(),
        nice: true,
        grid: true,
        axis: { label: "Tests" },
      },
    },
    tooltip: {
      use: tooltip,
      content: (
        points,
      ): {
        title?: string;
        rows: ChartTooltipRow[];
      } => {
        const point = points[0];
        if (!point) return { rows: [] };
        return {
          title: point.datum.label,
          rows: [
            {
              label: `Tests:`,
              value: point.datum.count.toString(),
              color: point.color,
            },
          ],
        };
      },
    },
    focus: "group-x",
  });
}

function groupIntoBuckets(
  arr: number[],
  bucketSize: number,
): HistogramChartRow[] {
  if (arr.length === 0) return [];
  const buckets: Record<number, number> = {};
  const maxValue = Math.max(...arr);
  const maxBucketStart = Math.floor(maxValue / bucketSize) * bucketSize;

  for (const item of arr) {
    const bucketStart = Math.floor(Math.round(item) / bucketSize) * bucketSize;
    buckets[bucketStart] = (buckets[bucketStart] ?? 0) + 1;
  }

  const result: HistogramChartRow[] = [];

  for (let start = 0; start <= maxBucketStart; start += bucketSize) {
    const end = start + bucketSize - 1;

    result.push({
      label: `${start}-${end}`,
      count: buckets[start] ?? 0,
    });
  }

  return result;
}
