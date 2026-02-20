import { Difficulty } from "@monkeytype/schemas/configs";
import { ChartData } from "@monkeytype/schemas/results";
import { Mode } from "@monkeytype/schemas/shared";
import { useQuery } from "@tanstack/solid-query";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { createMemo, createSignal, JSXElement, Show } from "solid-js";

import { getSingleResultQueryOptions } from "../../../collections/results";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { getSnapshot } from "../../../db";
import { getConfig } from "../../../signals/config";
import { getTheme } from "../../../signals/theme";
import { isModalOpen, showModal } from "../../../stores/modals";
import { Formatting } from "../../../utils/format";
import { replaceUnderscoresWithSpaces } from "../../../utils/strings";
import { get as getTypingSpeedUnit } from "../../../utils/typing-speed-units";
import { AnimatedModal } from "../../common/AnimatedModal";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { ChartJs } from "../../common/ChartJs";
import { Fa, FaProps } from "../../common/Fa";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";

export type Sorting = {
  // oxlint-disable-next-line typescript/no-explicit-any
  field: keyof SnapshotResult<any>;
  direction: "asc" | "desc";
};

export function Table<M extends Mode>(props: {
  data: SnapshotResult<M>[];
  onSortingChange: (sorting: Sorting) => void;
}): JSXElement {
  const [selectedResult, setSelectedResult] = createSignal<string | undefined>(
    undefined,
  );

  const columns = createMemo(() =>
    getColumns<M>({
      format: new Formatting(getConfig),
      onMiniResultChartSelected: (id) => {
        setSelectedResult(id);
        if (id !== undefined) showModal("MiniResultChartModal");
      },
    }),
  );

  return (
    <>
      <MiniResultChart resultId={selectedResult()} />
      <DataTable
        id="resultList"
        onSortingChange={(val) => {
          if (val.length === 0) {
            props.onSortingChange({ field: "timestamp", direction: "desc" });
          } else {
            props.onSortingChange({
              // oxlint-disable-next-line typescript/no-explicit-any
              field: val[0]?.id as keyof SnapshotResult<any>,
              direction: val[0]?.desc ? "desc" : "asc",
            });
          }
        }}
        class="table-auto [&>tbody>tr>td]:px-4 [&>tbody>tr>td]:py-2.5 [&>tbody>tr>td]:whitespace-nowrap xl:[&>tbody>tr>td]:px-6 [&>thead>tr>th]:px-4 xl:[&>thead>tr>th]:px-6"
        data={props.data}
        columns={columns()}
        fallback=<span>No data found. Check your filters.</span>
      />
    </>
  );
}

function MiniResultChart(props: { resultId: string | undefined }): JSXElement {
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

          const wpm = data.wpm.map((it) => typingSpeedUnit().fromWpm(it));
          const burst = data.burst.map((it) => typingSpeedUnit().fromWpm(it));

          const maxChartVal = Math.max(
            ...[Math.max(...wpm), Math.max(...burst)],
          );
          const minChartVal = beginAtZero()
            ? 0
            : Math.floor(Math.min(...[Math.min(...wpm), Math.min(...burst)]));

          return (
            <div class="">
              <ChartJs
                type="line"
                data={{
                  labels: data.wpm.map((_, index) => (index + 1).toString()),
                  datasets: [
                    {
                      label: "wpm",
                      data: wpm,
                      borderWidth: 3,
                      yAxisID: "wpm",
                      order: 2,
                      pointRadius: 1,
                    },
                    {
                      label: "burst",
                      data: burst,
                      borderWidth: 3,
                      yAxisID: "burst",
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
                      min: minChartVal,
                      max: maxChartVal,
                      ticks: {
                        autoSkip: true,
                        autoSkipPadding: 20,
                      },
                      grid: {
                        display: true,
                      },
                    },
                    burst: {
                      axis: "y",
                      display: false,
                      title: {
                        display: true,
                        text: "Burst " + typingSpeedUnit().fullUnitString,
                      },
                      beginAtZero: beginAtZero(),
                      min: minChartVal,
                      max: maxChartVal,
                      ticks: {
                        autoSkip: true,
                        autoSkipPadding: 20,
                      },
                      grid: {
                        display: false,
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

function getColumns<M extends Mode>({
  format,
  onMiniResultChartSelected,
}: {
  format: Formatting;
  onMiniResultChartSelected(val: string): void;
}): DataTableColumnDef<SnapshotResult<M>>[] {
  const defineColumn = createColumnHelper<SnapshotResult<M>>().accessor;
  const columns = [
    defineColumn("isPb", {
      header: "",
      cell: (info) => (info.getValue() ? <Fa icon="fa-crown" /> : ""),
      enableSorting: false,
    }),
    defineColumn("wpm", {
      header: format.typingSpeedUnit,
      cell: (info) =>
        format.typingSpeed(info.getValue(), { showDecimalPlaces: true }),
    }),
    defineColumn("rawWpm", {
      header: "raw",
      cell: (info) =>
        format.typingSpeed(info.getValue(), { showDecimalPlaces: true }),
    }),
    defineColumn("acc", {
      header: "accuracy",
      cell: (info) =>
        format.percentage(info.getValue(), { showDecimalPlaces: true }),
    }),
    defineColumn("consistency", {
      header: "consistency",
      cell: (info) =>
        format.percentage(info.getValue(), { showDecimalPlaces: true }),
    }),
    defineColumn("mode", {
      header: "mode",
      cell: (info) =>
        `${info.getValue()} ${info.row.original.mode2 === "custom" ? "" : info.row.original.mode2}`,
      meta: {
        breakpoint: "md",
      },
    }),
    defineColumn("_id", {
      header: "info",
      enableSorting: false,
      cell: (info) => {
        const hasChart =
          info.row.original.chartData !== "toolong" &&
          info.row.original.testDuration <= 122;

        return (
          <div class="flex gap-0.5">
            <span aria-label={info.row.original.language} data-balloon-pos="up">
              <Fa icon="fa-globe-americas" fixedWidth={true} />
            </span>
            <span
              aria-label={info.row.original.difficulty}
              data-balloon-pos="up"
            >
              <Fa {...difficultyIcon(info.row.original.difficulty)} />
            </span>
            <Show when={info.row.original.punctuation}>
              <span aria-label="punctuation" data-balloon-pos="up">
                <Fa icon="fa-at" fixedWidth={true} />
              </span>
            </Show>
            <Show when={info.row.original.numbers}>
              <span aria-label="numbers" data-balloon-pos="up">
                <Fa icon="fa-hashtag" fixedWidth={true} />
              </span>
            </Show>
            <Show when={info.row.original.blindMode}>
              <span aria-label="blind mode" data-balloon-pos="up">
                <Fa icon="fa-eye-slash" fixedWidth={true} />
              </span>
            </Show>
            <Show when={info.row.original.lazyMode}>
              <span aria-label="lazy mode" data-balloon-pos="up">
                <Fa icon="fa-couch" fixedWidth={true} />
              </span>
            </Show>
            <Show when={(info.row.original.funbox ?? []).length > 0}>
              <span
                aria-label={info.row.original.funbox
                  .map(replaceUnderscoresWithSpaces)
                  .join(", ")}
                data-balloon-pos="up"
              >
                <Fa icon="fa-gamepad" fixedWidth={true} />
              </span>
            </Show>
            <span
              data-balloon-pos="up"
              aria-label={
                hasChart
                  ? "View graph"
                  : "Graph history is not available for long tests"
              }
            >
              <Button
                disabled={!hasChart}
                class="p-0 text-text"
                type="text"
                fa={{ icon: "fa-chart-line", fixedWidth: true }}
                onClick={() => {
                  onMiniResultChartSelected(info.getValue());
                }}
              />
            </span>
          </div>
        );
      },
      meta: {
        breakpoint: "md",
      },
    }),
    defineColumn("tags", {
      header: "tags",
      cell: (info) => (
        <Show when={info.getValue().length > 0}>
          <span
            data-balloon-pos="up"
            aria-label={info
              .getValue()
              .map(
                (it) => getSnapshot()?.tags.find((tag) => tag._id === it)?.name,
              )
              .join(", ")}
          >
            <Fa icon="fa-tags" fixedWidth />
          </span>
        </Show>
      ),
      meta: {
        breakpoint: "md",
      },
    }),
    defineColumn("timestamp", {
      header: "date",
      cell: (info) => (
        <>
          <div class="text-xs">
            {dateFormat(info.getValue(), "dd MMM yyyy")}
          </div>
          <div class="text-xs text-sub">
            {dateFormat(info.getValue(), "HH:mm")}
          </div>
        </>
      ),
    }),
  ];
  return columns;
}

function difficultyIcon(difficulty: Difficulty): FaProps {
  if (difficulty === "expert") {
    return { variant: "solid", icon: "fa-star-half-alt", fixedWidth: true };
  } else if (difficulty === "master") {
    return { variant: "solid", icon: "fa-star", fixedWidth: true };
  } else {
    return { variant: "regular", icon: "fa-star", fixedWidth: true };
  }
}
