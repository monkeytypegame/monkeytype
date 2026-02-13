import { Difficulty } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { createMemo, For, JSXElement, Show } from "solid-js";

import { SnapshotResult } from "../../../constants/default-snapshot";
import { getConfig } from "../../../signals/config";
import { Formatting } from "../../../utils/format";
import { Fa, FaProps } from "../../common/Fa";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";
import {
  TableBody,
  TableCell,
  TableRow,
  Table as UiTable,
} from "../../ui/table/Table";

export type Sorting = {
  // oxlint-disable-next-line typescript/no-explicit-any
  field: keyof SnapshotResult<any>;
  direction: "asc" | "desc";
};

export function Table<M extends Mode>(props: {
  data: SnapshotResult<M>[];
  onSortingChange: (sorting: Sorting) => void;
}): JSXElement {
  const columns = createMemo(() =>
    getColumns<M>({
      format: new Formatting(getConfig),
    }),
  );
  return (
    <>
      <UiTable>
        <TableBody>
          <For each={props.data}>
            {(row) => (
              <TableRow>
                <TableCell>
                  {new Formatting(getConfig).typingSpeed(row.wpm, {
                    showDecimalPlaces: true,
                  })}
                </TableCell>
                <TableCell>{row.acc}</TableCell>
                <TableCell>{row.timestamp}</TableCell>
              </TableRow>
            )}
          </For>
        </TableBody>
      </UiTable>
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

function getColumns<M extends Mode>({
  format,
}: {
  format: Formatting;
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
    }),
    defineColumn("_id", {
      header: "info",
      cell: (info) => (
        <>
          <span aria-label={info.row.original.language} data-balloon-pos="up">
            <Fa icon="fa-globe-americas" fixedWidth={true} />
          </span>
          <span aria-label={info.row.original.difficulty} data-balloon-pos="up">
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
                .map((it) => it.replace(/_/g, " "))
                .join(", ")}
              data-balloon-pos="up"
            >
              <Fa icon="fa-gamepad" fixedWidth={true} />
            </span>
          </Show>
        </>
      ),
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
