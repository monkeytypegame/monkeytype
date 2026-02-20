import { ChartData } from "@monkeytype/schemas/results";
import { useQuery } from "@tanstack/solid-query";
import { createMemo, JSXElement } from "solid-js";

import { getSingleResultQueryOptions } from "../../../collections/results";
import { getConfig } from "../../../signals/config";
import { getTheme } from "../../../signals/theme";
import { isModalOpen } from "../../../stores/modals";
import { get as getTypingSpeedUnit } from "../../../utils/typing-speed-units";
import { AnimatedModal } from "../../common/AnimatedModal";
import AsyncContent from "../../common/AsyncContent";
import { ChartJs } from "../../common/ChartJs";

export function MiniResultChart(props: {
  resultId: string | undefined;
}): JSXElement {
  const query = useQuery(() => ({
    ...getSingleResultQueryOptions(props.resultId as string),
    enabled:
      isModalOpen("MiniResultChartModal") && props.resultId !== undefined,
  }));

  const beginAtZero = createMemo(() => getConfig.startGraphsAtZero);
  const typingSpeedUnit = createMemo(() =>
    getTypingSpeedUnit(getConfig.typingSpeedUnit),
  );

  return (
    <AnimatedModal id="MiniResultChartModal" modalClass="max-w-4xl">
      <AsyncContent query={query}>
        {(result) => {
          const data = result.chartData as ChartData;

          return (
            <div class="">
              <ChartJs
                type="line"
                data={{
                  labels: data.wpm.map((_, index) => (index + 1).toString()),
                  datasets: [
                    {
                      label: "wpm",
                      data: data.wpm.map((it) => typingSpeedUnit().fromWpm(it)),
                      borderWidth: 3,
                      yAxisID: "wpm",
                      order: 2,
                      pointRadius: 1,
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
                    },
                    {
                      label: "errors",
                      data: data.err,
                      pointBackgroundColor: getTheme().error,
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
            </div>
          );
        }}
      </AsyncContent>
    </AnimatedModal>
  );
}
