import {
  AccessorFnColumnDef,
  AccessorKeyColumnDef,
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/solid-table";
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  Match,
  Show,
  Switch,
} from "solid-js";
import { z } from "zod";

import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { bp } from "../../../signals/breakpoints";
import { Conditional } from "../../common/Conditional";
import { Fa } from "../../common/Fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

const SortingStateSchema = z.array(
  z.object({
    desc: z.boolean(),
    id: z.string(),
  }),
);

export type DataTableColumnDef<TData, TValue> =
  | ColumnDef<TData, TValue>
  | AccessorFnColumnDef<TData, TValue>
  | AccessorKeyColumnDef<TData, TValue>;

export type DataTableProps<TData, TValue> = {
  id: string;
  columns: DataTableColumnDef<TData, TValue>[];
  data: TData[];
  fallback?: JSXElement;
  hideHeader?: true;
  rowSelection?: {
    getRowId: (row: TData) => string;
    class: string;
    activeRow: Accessor<string | null>;
  };
};

export function DataTable<TData, TValue = unknown>(
  props: DataTableProps<TData, TValue>,
): JSXElement {
  const [sorting, setSorting] = useLocalStorage<SortingState>({
    //oxlint-disable-next-line solid/reactivity
    key: `${props.id}Sort`,
    schema: SortingStateSchema,
    fallback: [],
    //migrate old state from sorted-table
    migrate: (value: Record<string, unknown> | unknown[]) =>
      value !== null &&
      typeof value === "object" &&
      "property" in value &&
      "descending" in value
        ? [
            {
              id: value["property"] as string,
              desc: value["descending"] as boolean,
            },
          ]
        : [],
  });

  const columnVisibility = createMemo(() => {
    const current = bp();
    const result = Object.fromEntries(
      props.columns.map((col, index) => {
        col.id =
          col.id ??
          ("accessorKey" in col && col.accessorKey !== null
            ? String(col.accessorKey)
            : `__col_${index}`);

        const visible =
          current[col.meta?.breakpoint ?? "xxs"] &&
          (col.meta?.maxBreakpoint === undefined ||
            !current[col.meta?.maxBreakpoint]);

        return [col.id, visible];
      }),
    );

    return result;
  });

  const [rowSelection, setRowSelection] = createSignal({});
  createEffect(() => {
    if (!props.rowSelection || props.rowSelection.activeRow === undefined) {
      setRowSelection({});
    } else {
      const activeId = props.rowSelection.activeRow();
      setRowSelection(activeId !== null ? { [activeId]: true } : {});
    }
  });

  const table = createSolidTable<TData>({
    get data() {
      return props.data;
    },
    get columns() {
      return props.columns;
    },
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: () => props.rowSelection !== undefined,
    getRowId: (row, index) =>
      props.rowSelection !== undefined
        ? props.rowSelection.getRowId(row)
        : index.toString(),
    onRowSelectionChange: setRowSelection,

    state: {
      get sorting() {
        return sorting();
      },
      get columnVisibility() {
        return columnVisibility();
      },
      get rowSelection() {
        return rowSelection();
      },
    },
  });

  return (
    <Show when={table.getRowModel().rows?.length} fallback={props.fallback}>
      <Table id={props.id}>
        <Show when={!props.hideHeader}>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <Conditional
                        if={header.column.getCanSort()}
                        then={
                          <TableHead
                            colSpan={header.colSpan}
                            aria-sort={
                              header.column.getIsSorted() === "asc"
                                ? "ascending"
                                : header.column.getIsSorted() === "desc"
                                  ? "descending"
                                  : "none"
                            }
                          >
                            <button
                              type="button"
                              role="button"
                              onClick={(e) => {
                                header.column.getToggleSortingHandler()?.(e);
                              }}
                              class="m-0 box-border flex h-full w-full cursor-pointer items-start rounded-none border-0 bg-transparent p-2 font-normal whitespace-nowrap text-sub hover:bg-sub-alt"
                              classList={{
                                "justify-start text-left":
                                  (header.column.columnDef.meta?.align ??
                                    "left") === "left",
                                "justify-center text-center":
                                  header.column.columnDef.meta?.align ===
                                  "center",
                                "justify-end  text-right":
                                  header.column.columnDef.meta?.align ===
                                  "right",
                              }}
                              {...(header.column.columnDef.meta?.headerMeta ??
                                {})}
                            >
                              <Show when={!header.isPlaceholder}>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </Show>

                              <Switch fallback={<i class="fa-fw"></i>}>
                                <Match
                                  when={header.column.getIsSorted() === "asc"}
                                >
                                  <Fa
                                    icon={"fa-sort-up"}
                                    fixedWidth
                                    aria-hidden="true"
                                  />
                                </Match>
                                <Match
                                  when={header.column.getIsSorted() === "desc"}
                                >
                                  <Fa
                                    icon={"fa-sort-down"}
                                    fixedWidth
                                    aria-hidden="true"
                                  />
                                </Match>
                              </Switch>
                            </button>
                          </TableHead>
                        }
                        else={
                          <TableHead
                            colSpan={header.colSpan}
                            classList={{
                              "text-left":
                                (header.column.columnDef.meta?.align ??
                                  "left") === "left",
                              "text-center":
                                header.column.columnDef.meta?.align ===
                                "center",
                              "text-right":
                                header.column.columnDef.meta?.align === "right",
                            }}
                            {...(header.column.columnDef.meta?.headerMeta ??
                              {})}
                          >
                            <Show when={!header.isPlaceholder}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </Show>
                          </TableHead>
                        }
                      />
                    )}
                  </For>
                </TableRow>
              )}
            </For>
          </TableHeader>
        </Show>
        <TableBody>
          <For each={table.getRowModel().rows}>
            {(row) => (
              <TableRow
                {...{
                  "data-state": row.getIsSelected() ? "selected" : undefined,
                }}
                class={
                  row.getIsSelected() && props.rowSelection
                    ? props.rowSelection.class
                    : ""
                }
              >
                <For each={row.getVisibleCells()}>
                  {(cell) => {
                    const cellMeta =
                      typeof cell.column.columnDef.meta?.cellMeta === "function"
                        ? cell.column.columnDef.meta.cellMeta({
                            value: cell.getValue(),
                            row: cell.row.original,
                          })
                        : (cell.column.columnDef.meta?.cellMeta ?? {});
                    return (
                      <TableCell
                        {...cellMeta}
                        classList={{
                          "text-left":
                            (cell.column.columnDef.meta?.align ?? "left") ===
                            "left",
                          "text-center":
                            cell.column.columnDef.meta?.align === "center",
                          "text-right":
                            cell.column.columnDef.meta?.align === "right",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  }}
                </For>
              </TableRow>
            )}
          </For>
        </TableBody>
      </Table>
    </Show>
  );
}
