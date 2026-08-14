import { Difficulty } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { Accessor, createMemo, createSignal, JSXElement, Show } from "solid-js";

import { type TagItem, useTagsLiveQuery } from "../../../collections/tags";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { getFormatting } from "../../../states/core";
import { showEditResultTagsModal } from "../../../states/edit-result-tags";
import { showModal } from "../../../states/modals";
import { showNoticeNotification } from "../../../states/notifications";
import { cn } from "../../../utils/cn";
import { Formatting } from "../../../utils/format";
import { replaceUnderscoresWithSpaces } from "../../../utils/strings";
import { Button } from "../../common/Button";
import { Fa, FaProps } from "../../common/Fa";
import { Tooltip } from "../../common/Tooltip";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";
import { MiniResultChart } from "./MiniResultChart";

type Sorting = {
  field: keyof SnapshotResult<Mode>;
  direction: "asc" | "desc";
};

export function Table<M extends Mode>(props: {
  data: SnapshotResult<M>[];
  onSortingChange: (sorting: Sorting) => void;
  selectedRowId: Accessor<string | null>;
}): JSXElement {
  const [selectedResult, setSelectedResult] = createSignal<string | undefined>(
    undefined,
  );

  const tags = useTagsLiveQuery();

  const columns = createMemo(() =>
    getColumns<M>({
      format: getFormatting(),
      tags: tags(),
      onMiniResultChartSelected: (id) => {
        setSelectedResult(id);
        if (id !== undefined) showModal("MiniResultChartModal");
      },
    }),
  );

  return (
    <>
      <Show when={selectedResult() !== undefined}>
        <MiniResultChart resultId={selectedResult() as string} />
      </Show>
      <DataTable
        id="resultList"
        onSortingChange={(val) => {
          if (val.length === 0) {
            props.onSortingChange({ field: "timestamp", direction: "desc" });
          } else {
            props.onSortingChange({
              field: val[0]?.id as keyof SnapshotResult<Mode>,
              direction: val[0]?.desc ? "desc" : "asc",
            });
          }
        }}
        class={cn("table-auto", "text-xs md:text-sm lg:text-base")}
        // headerCellClass="p-1"
        // bodyCellClass="p-1"
        data={props.data}
        columns={columns()}
        fallback=<span>No data found. Check your filters.</span>
        rowSelection={{
          getRowId: (row) => row._id,
          activeRow: props.selectedRowId,
          class: cn(
            "text-main [&>td>div]:text-main [&>td>div>a]:text-main",
            "**:data-[ui-element='button']:[--themable-button-text:var(--text-main)]",
          ),
        }}
      />
    </>
  );
}

function getColumns<M extends Mode>({
  format,
  tags,
  onMiniResultChartSelected,
}: {
  format: Formatting;
  tags: TagItem[];
  onMiniResultChartSelected(val: string): void;
}): DataTableColumnDef<SnapshotResult<M>>[] {
  const defineColumn = createColumnHelper<SnapshotResult<M>>().accessor;
  const columns = [
    defineColumn("isPb", {
      header: "",
      cell: (info) =>
        info.getValue() ? (
          <Fa icon="fa-crown" />
        ) : (
          <Fa icon="fa-crown" class="opacity-0" />
        ),
      enableSorting: false,
      meta: {
        cellMeta: {
          class: cn("w-0", "xl:pr-6 xl:pl-8", "pl-4"),
        },
      },
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
      meta: {
        breakpoint: "xs",
      },
    }),
    defineColumn("acc", {
      header: "accuracy",
      cell: (info) =>
        format.percentage(info.getValue(), { showDecimalPlaces: true }),
      meta: {
        breakpoint: "xs",
      },
    }),
    defineColumn("consistency", {
      header: "consistency",
      cell: (info) =>
        format.percentage(info.getValue(), { showDecimalPlaces: true }),
      meta: {
        breakpoint: "xs",
      },
    }),
    defineColumn("charStats", {
      header: "chars",
      cell: (info) =>
        `${info.row.original.charStats[0]}/${info.row.original.charStats[1]}/${info.row.original.charStats[2]}/${info.row.original.charStats[3]}`,
      meta: {
        breakpoint: "lg",
      },
    }),
    defineColumn("mode", {
      header: "mode",
      enableSorting: false,
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
            <Tooltip text={info.row.original.language} as={"span"}>
              <Fa icon="fa-globe-americas" fixedWidth={true} />
            </Tooltip>
            <Tooltip text={info.row.original.difficulty} as={"span"}>
              <Fa {...difficultyIcon(info.row.original.difficulty)} />
            </Tooltip>
            <Show when={info.row.original.punctuation}>
              <Tooltip text={"punctuation"} as={"span"}>
                <Fa icon="fa-at" fixedWidth={true} />
              </Tooltip>
            </Show>
            <Show when={info.row.original.numbers}>
              <Tooltip text={"numbers"} as={"span"}>
                <Fa icon="fa-hashtag" fixedWidth={true} />
              </Tooltip>
            </Show>
            <Show when={info.row.original.blindMode}>
              <Tooltip text={"blind mode"} as={"span"}>
                <Fa icon="fa-eye-slash" fixedWidth={true} />
              </Tooltip>
            </Show>
            <Show when={info.row.original.lazyMode}>
              <Tooltip text={"lazy mode"} as={"span"}>
                <Fa icon="fa-couch" fixedWidth={true} />
              </Tooltip>
            </Show>
            <Show when={(info.row.original.funbox ?? []).length > 0}>
              <Tooltip
                text={info.row.original.funbox
                  .map(replaceUnderscoresWithSpaces)
                  .join(", ")}
                as={"span"}
              >
                <Fa icon="fa-gamepad" fixedWidth={true} />
              </Tooltip>
            </Show>
            <Tooltip
              text={
                hasChart
                  ? "View graph"
                  : "Graph history is not available for long tests"
              }
              as={"span"}
            >
              <Button
                disabled={!hasChart}
                class="p-0 text-inherit"
                variant="text"
                fa={{ icon: "fa-chart-line", fixedWidth: true }}
                onClick={() => {
                  onMiniResultChartSelected(info.getValue());
                }}
              />
            </Tooltip>
          </div>
        );
      },
      meta: {
        breakpoint: "sm",
      },
    }),
    defineColumn("tags", {
      header: "tags",
      enableSorting: false,
      cell: (info) => {
        const hasTags = () => info.getValue().length > 0;
        return (
          <Button
            variant="text"
            class={
              hasTags() ? "[--themable-button-text:var(--text-color)]" : ""
            }
            fa={{
              icon: info.getValue().length > 1 ? "fa-tags" : "fa-tag",
              fixedWidth: true,
            }}
            balloon={{
              text: hasTags()
                ? info
                    .getValue()
                    .map(
                      (it) =>
                        tags.find((tag) => tag._id === it)?.name ??
                        "unknown tag",
                    )
                    .join(", ")
                : "no tags",
            }}
            onClick={() => {
              if (tags.length === 0) {
                showNoticeNotification(
                  "You have no tags. You can create one in the tags section of the settings page.",
                );
                return;
              }

              showEditResultTagsModal({
                _id: info.row.original._id,
                tags: info.getValue(),
              });
            }}
          />
        );
      },
      meta: {
        breakpoint: "sm",
      },
    }),
    defineColumn("timestamp", {
      header: "date",
      cell: (info) => (
        <>
          <div class="text-em-sm">
            {dateFormat(info.getValue(), "dd MMM yyyy")}
          </div>
          <div class="text-em-sm text-sub">
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
