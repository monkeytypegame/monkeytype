import { ChartData } from "@monkeytype/schemas/results";
import {
  defineChart,
  dot,
  lineY,
  type ChartTooltipRow,
} from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Chart } from "@tanstack/charts/solid";
import { tooltip } from "@tanstack/charts/tooltip";
import { useQuery } from "@tanstack/solid-query";
import { curveCardinal } from "d3-shape";
import { createMemo, JSXElement, Show } from "solid-js";

import { getSingleResultQueryOptions } from "../../../collections/results";
import { getConfig } from "../../../config/store";
import { Theme } from "../../../constants/themes";
import { getUseTanstackCharts } from "../../../dev/chart-parity";
import { isModalOpen } from "../../../states/modals";
import { getTheme } from "../../../theme/state";
import {
  get as getTypingSpeedUnit,
  TypingSpeedUnitSettings,
} from "../../../utils/typing-speed-units";
import { errorCross } from "../../charts/error-cross";
import { AnimatedModal } from "../../common/AnimatedModal";
import AsyncContent from "../../common/AsyncContent";
import { ChartJs } from "../../common/ChartJs";

// chart.js curves every line with the global `tension: 0.5` default; the
// spec settles the TanStack equivalent as cardinal at tension 0.5 (monotone
// is the fallback if the comparison looks off)
const speedCurve = d3Curve(curveCardinal.tension(0.5));

/**
 * One second of the mini result chart: the per-second speeds, preconverted
 * to the configured unit, plus the error count.
 */
export type MiniResultRow = {
  /** 1-based second, the old x labels */
  second: number;
  wpm: number;
  burst: number;
  err: number;
};

/**
 * The result mini chart (tanstack-charts S6): the per-second wpm and burst
 * lines on a left speed scale and the error crosses on a right scale, as
 * shown in the result's mini chart modal. Renders the Chart.js half by
 * default; the dev-only parity flag (dev/chart-parity) switches to the
 * TanStack implementation.
 */
export function MiniResultChart(props: { resultId: string }): JSXElement {
  const query = useQuery(() => ({
    ...getSingleResultQueryOptions(props.resultId),
    enabled: isModalOpen("MiniResultChartModal"),
  }));

  const beginAtZero = createMemo(() => getConfig.startGraphsAtZero);
  const typingSpeedUnit = createMemo(() =>
    getTypingSpeedUnit(getConfig.typingSpeedUnit),
  );

  return (
    <AnimatedModal id="MiniResultChartModal" modalClass="max-w-300">
      <AsyncContent queries={{ query }}>
        {({ queryData }) => {
          const data = queryData().chartData as ChartData;

          return (
            <div class="h-60 w-full">
              <Show
                when={getUseTanstackCharts()}
                fallback={
                  // Stepping stone: replaced by the TanStack implementation; removed in S12
                  <ChartJs
                    name="MiniResult"
                    type="line"
                    data={{
                      labels: data.wpm.map((_, index) =>
                        (index + 1).toString(),
                      ),
                      datasets: [
                        {
                          label: "wpm",
                          data: data.wpm.map((it) =>
                            typingSpeedUnit().fromWpm(it),
                          ),
                          borderWidth: 3,
                          yAxisID: "wpm",
                          order: 2,
                          pointRadius: 1,
                          fill: false,
                          borderColor: getTheme().main,
                          backgroundColor: getTheme().main,
                        },
                        {
                          label: "burst",
                          data: data.burst.map((it) =>
                            typingSpeedUnit().fromWpm(it),
                          ),
                          borderWidth: 3,
                          yAxisID: "wpm",
                          order: 3,
                          pointRadius: 1,
                          fill: false,
                          borderColor: getTheme().sub,
                          backgroundColor: getTheme().sub,
                        },
                        {
                          label: "errors",
                          data: data.err,
                          pointBorderColor: getTheme().error,
                          backgroundColor: getTheme().error,
                          borderWidth: 2,
                          order: 1,
                          yAxisID: "error",
                          type: "scatter",
                          pointStyle: "crossRot",
                          pointRadius: function (context): number {
                            const index = context.dataIndex;
                            const value = context.dataset.data[index] as number;
                            return (value ?? 0) <= 0 ? 0 : 3;
                          },
                          pointHoverRadius: function (context): number {
                            const index = context.dataIndex;
                            const value = context.dataset.data[index] as number;
                            return (value ?? 0) <= 0 ? 0 : 5;
                          },
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          axis: "x",
                          ticks: {
                            autoSkip: true,
                            autoSkipPadding: 20,
                          },
                          display: true,
                          title: {
                            display: false,
                            text: "Seconds",
                          },
                        },
                        wpm: {
                          axis: "y",
                          display: true,
                          title: {
                            display: true,
                            text: typingSpeedUnit().fullUnitString,
                          },
                          beginAtZero: beginAtZero(),
                          ticks: {
                            autoSkip: true,
                            autoSkipPadding: 20,
                          },
                          grid: {
                            display: true,
                          },
                        },
                        error: {
                          display: true,
                          position: "right",
                          title: {
                            display: true,
                            text: "Errors",
                          },
                          beginAtZero: beginAtZero(),
                          ticks: {
                            precision: 0,
                            autoSkip: true,
                            autoSkipPadding: 20,
                          },
                          grid: {
                            display: false,
                          },
                        },
                      },
                      plugins: {
                        annotation: {
                          annotations: [],
                        },
                        tooltip: {
                          animation: { duration: 250 },
                          mode: "index",
                          intersect: false,
                        },
                      },
                    }}
                  />
                }
              >
                <Chart
                  definition={buildMiniResultChartDefinition(
                    data,
                    getTheme,
                    beginAtZero(),
                    typingSpeedUnit(),
                  )}
                  ariaLabel="Result speed and errors"
                  // responsive per the TanStack guide: no width (the host
                  // follows the modal; initialWidth seeds the first frame) and
                  // a fixed height, like the h-60 wrapper
                  height={240}
                  initialWidth={640}
                />
              </Show>
            </div>
          );
        }}
      </AsyncContent>
    </AnimatedModal>
  );
}

/**
 * The TanStack definition of the mini result chart: the wpm and burst lines
 * with their 1 px dots on a left speed scale, the error crosses on a right
 * scale, and a per-second tooltip over all three series. Pure: asserted in
 * __tests__/components/pages/account/MiniResultChart.spec.tsx.
 */
export function buildMiniResultChartDefinition(
  chartData: ChartData,
  theme: () => Theme,
  beginAtZero: boolean,
  unit: TypingSpeedUnitSettings,
) {
  const rows = chartData.wpm.map((wpm, index): MiniResultRow => ({
    second: index + 1,
    wpm: unit.fromWpm(wpm),
    burst: unit.fromWpm(chartData.burst[index] ?? 0),
    err: chartData.err[index] ?? 0,
  }));

  const second = (it: MiniResultRow) => it.second;
  const maxSpeed = Math.max(0, ...rows.map((it) => Math.max(it.wpm, it.burst)));
  const maxErr = Math.max(0, ...rows.map((it) => it.err));

  return defineChart({
    marks: [
      // the old draw order, back to front: burst (3) under wpm (2) under the
      // error crosses (1); the scene paints marks in array order
      lineY(rows, {
        id: "burst",
        x: second,
        y: (it) => it.burst,
        stroke: theme().sub,
        strokeWidth: 3,
        curve: speedCurve,
      }),
      dot(rows, {
        id: "burst-points",
        x: second,
        y: (it) => it.burst,
        color: () => theme().sub,
        r: 1,
      }),
      lineY(rows, {
        id: "wpm",
        x: second,
        y: (it) => it.wpm,
        stroke: theme().main,
        strokeWidth: 3,
        curve: speedCurve,
      }),
      dot(rows, {
        id: "wpm-points",
        x: second,
        y: (it) => it.wpm,
        color: () => theme().main,
        r: 1,
      }),
      errorCross(rows, {
        id: "errors",
        x: second,
        y: (it) => it.err,
        yScale: "error",
        color: theme().error,
        size: 3,
        strokeWidth: 2,
      }),
    ],
    scales: {
      x: {
        scale: () => scaleLinear(),
        // the old category scale drew no grid
        grid: false,
      },
      // the old left "wpm" scale: the reserved `y` id
      y: {
        channel: "y",
        side: "left",
        scale: () => scaleLinear(),
        nice: true,
        // the old scale: from zero when configured, else fitted to the lines;
        // the viewport only when the max is positive - the library rejects a
        // [0, 0] domain
        ...(beginAtZero && maxSpeed > 0
          ? { viewport: { domain: [0, maxSpeed] } }
          : {}),
        grid: { stroke: theme().subAlt },
        axis: {
          label: unit.fullUnitString,
          line: { stroke: theme().subAlt },
        },
      },
      error: {
        channel: "y",
        side: "right",
        scale: () => scaleLinear(),
        nice: true,
        ...(beginAtZero && maxErr > 0
          ? { viewport: { domain: [0, maxErr] } }
          : {}),
        // the old scale drew no grid
        grid: false,
        axis: {
          label: "Errors",
          line: { stroke: theme().subAlt },
          // the old ticks: precision 0
          ticks: {
            format: (value) =>
              typeof value === "number"
                ? String(Math.round(value))
                : String(value),
          },
        },
      },
    },
    // the old tooltip: index mode over all three series, one item per
    // dataset; the group-x focus keeps wpm, burst and errors under the
    // pointer together, and the old 250 ms tween
    focus: "group-x",
    tooltip: {
      use: tooltip,
      motion: { type: "tween", duration: 250, easing: "ease-out" },
      content: (
        points,
      ): {
        title?: string;
        rows: ChartTooltipRow[];
      } => {
        const point = points[0];
        if (!point) return { rows: [] };
        const it = point.datum;
        // the old default callbacks: the x label, then ": " and the raw
        // (unit-converted) value per dataset, in dataset order
        const rows: ChartTooltipRow[] = [
          {
            label: `${it.second}: ${it.wpm}`,
            value: "",
            color: theme().main,
          },
          {
            label: `${it.second}: ${it.burst}`,
            value: "",
            color: theme().sub,
          },
          {
            label: `${it.second}: ${it.err}`,
            value: "",
            color: theme().error,
          },
        ];
        return { title: String(it.second), rows };
      },
    },
  });
}
