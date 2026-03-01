import {
  AccessorFnColumnDef,
  AccessorKeyColumnDef,
  ColumnDef,
  ColumnMeta,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/solid-table";
import {
  Accessor,
  createEffect,
  createSignal,
  For,
  JSXElement,
  Match,
  Show,
  splitProps,
  Switch,
} from "solid-js";
import { z } from "zod";

import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { BreakpointKey } from "../../../signals/breakpoints";
import { cn } from "../../../utils/cn";
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

// oxlint-disable-next-line typescript/no-explicit-any
export type DataTableColumnDef<TData, TValue = any> =
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
  class?: string;
};

// oxlint-disable-next-line typescript/no-explicit-any
export function DataTable<TData, TValue = any>(
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
      get rowSelection() {
        return rowSelection();
      },
    },
  });

  const columnVisibility = (
    meta:
      | undefined
      | Pick<ColumnMeta<unknown, unknown>, "breakpoint" | "maxBreakpoint">,
  ): string => {
    const mapBreakpoint = (bp: BreakpointKey | undefined) =>
      bp === undefined ? undefined : bp === "xxl" ? "2xl" : bp.toString();
    const visible =
      meta?.breakpoint !== undefined
        ? `${mapBreakpoint(meta?.breakpoint)}:table-cell hidden`
        : "";

    const result = cn(
      visible,
      meta?.maxBreakpoint && meta?.maxBreakpoint + ":hidden",
    );
    console.log("### meta", meta, result);
    return result;
  };

  return (
    <Show when={table.getRowModel().rows?.length} fallback={props.fallback}>
      <Table id={props.id} class={props.class}>
        <Show when={!props.hideHeader}>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow class="odd:bg-bg">
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
                            class={columnVisibility(
                              header.column.columnDef.meta,
                            )}
                          >
                            <button
                              type="button"
                              role="button"
                              onClick={(e) => {
                                header.column.getToggleSortingHandler()?.(e);
                              }}
                              class={cn(
                                "m-0 box-border flex h-full w-full cursor-pointer items-start rounded-none border-0 bg-transparent p-2 font-normal whitespace-nowrap text-sub hover:bg-sub-alt",
                                {
                                  "justify-start text-left":
                                    (header.column.columnDef.meta?.align ??
                                      "left") === "left",
                                  "justify-center text-center":
                                    header.column.columnDef.meta?.align ===
                                    "center",
                                  "justify-end text-right":
                                    header.column.columnDef.meta?.align ===
                                    "right",
                                },
                                header.column.columnDef.meta?.headerClass,
                              )}
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
                            class={cn(
                              {
                                "text-left":
                                  (header.column.columnDef.meta?.align ??
                                    "left") === "left",
                                "text-center":
                                  header.column.columnDef.meta?.align ===
                                  "center",
                                "text-right":
                                  header.column.columnDef.meta?.align ===
                                  "right",
                              },
                              columnVisibility(header.column.columnDef.meta),
                            )}
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
                    const [cellClass, cellMeta] = splitProps(
                      typeof cell.column.columnDef.meta?.cellMeta === "function"
                        ? cell.column.columnDef.meta.cellMeta({
                            value: cell.getValue(),
                            row: cell.row.original,
                          })
                        : (cell.column.columnDef.meta?.cellMeta ?? {}),
                      ["class"],
                    );
                    return (
                      <TableCell
                        {...cellMeta}
                        class={cn(
                          "",
                          {
                            "text-left":
                              (cell.column.columnDef.meta?.align ?? "left") ===
                              "left",
                            "text-center":
                              cell.column.columnDef.meta?.align === "center",
                            "text-right":
                              cell.column.columnDef.meta?.align === "right",
                          },
                          columnVisibility(cell.column.columnDef.meta),
                          cellClass.class,
                        )}
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
