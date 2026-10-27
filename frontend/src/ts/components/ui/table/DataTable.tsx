import {
  AccessorFnColumnDef,
  AccessorKeyColumnDef,
  ColumnDef,
  columnVisibilityFeature,
  createSortedRowModel,
  createTable,
  FlexRender,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type RowData,
  type SortingState,
} from "@tanstack/solid-table";
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  Match,
  onCleanup,
  Show,
  splitProps,
  Switch,
} from "solid-js";
import { z } from "zod";

import { createEffectOn } from "../../../hooks/effects";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { cn } from "../../../utils/cn";
import { qs } from "../../../utils/dom";
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

// Features used by every DataTable; keep the definition static (outside any
// component) so all tables share one features type and one row model factory.
const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  // getVisibleCells() is feature-gated in v9; v8 always provided it
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
});

export type DataTableFeatures = typeof dataTableFeatures;

// oxlint-disable-next-line typescript/no-explicit-any
export type DataTableColumnDef<TData extends RowData, TValue = any> =
  | ColumnDef<DataTableFeatures, TData, TValue>
  | AccessorFnColumnDef<DataTableFeatures, TData, TValue>
  | AccessorKeyColumnDef<DataTableFeatures, TData, TValue>;

export type DataTableProps<TData extends RowData, TValue> = {
  id: string;
  columns: DataTableColumnDef<TData, TValue>[];
  data: TData[];
  fallback?: JSXElement;
  hideHeader?: true;
  rowSelection?: {
    getRowId: (row: TData) => string;
    class: string;
    activeRow: Accessor<string | null>;
    /** Tracked: each change scrolls the active row into view (after a frame) */
    scrollToActiveRow?: Accessor<unknown>;
  };
  scrollToSelectedRow?: Accessor<boolean>;
  class?: string;
  headerCellClass?: string;
  bodyCellClass?: string;
  onSortingChange?: (sorting: SortingState) => void;
  noDataRow?:
    | true
    | {
        content: JSXElement;
      };
};

// oxlint-disable-next-line typescript/no-explicit-any
export function DataTable<TData extends RowData, TValue = any>(
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
    const scrollToSelectedRow = props.scrollToSelectedRow?.();
    if (props.rowSelection?.activeRow === undefined) {
      setRowSelection({});
    } else {
      const activeId = props.rowSelection.activeRow();
      setRowSelection(activeId !== null ? { [activeId]: true } : {});
      if (scrollToSelectedRow) {
        requestAnimationFrame(() => {
          qs(`#${props.id} tr[data-state="selected"]`)?.scrollIntoView({
            block: "center",
          });
        });
      }
    }
  });

  const rowElements = new Map<string, HTMLTableRowElement>();
  createEffectOn(
    () => props.rowSelection?.scrollToActiveRow?.(),
    () => {
      requestAnimationFrame(() => {
        const activeId = props.rowSelection?.activeRow();
        if (activeId === null || activeId === undefined) return;
        rowElements.get(activeId)?.scrollIntoView({ block: "center" });
      });
    },
    { defer: true },
  );

  // Ensure reactivity: always produce a fresh array reference
  const data = createMemo(() => props.data.map((it) => ({ ...it })));

  // A single persistent table instance; data and columns are passed as
  // getters so v9's options store stays reactive.
  const table = createTable<DataTableFeatures, TData>({
    features: dataTableFeatures,
    get data() {
      return data();
    },
    // oxlint-disable-next-line typescript/no-explicit-any
    get columns(): ColumnDef<DataTableFeatures, TData, any>[] {
      return props.columns;
    },
    onSortingChange: (it) => {
      setSorting(it);
      props.onSortingChange?.(sorting());
    },

    //oxlint-disable-next-line solid/reactivity
    ...(props.onSortingChange ? { manualSorting: true } : {}),
    enableRowSelection: () => props.rowSelection !== undefined,
    getRowId: (row, index) =>
      props.rowSelection !== undefined
        ? props.rowSelection.getRowId(row)
        : typeof (row as Record<string, unknown>)["_id"] === "string"
          ? ((row as Record<string, unknown>)["_id"] as string)
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

  //create column visibility classes once, make them accessible via the column.id
  const columnVisibility = createMemo(() => {
    return Object.fromEntries(
      table.getAllColumns().map((it) => {
        const breakpoint =
          it.columnDef.meta?.breakpoint === "xxl"
            ? "2xl"
            : it.columnDef.meta?.breakpoint;
        const maxBreakpoint =
          it.columnDef.meta?.maxBreakpoint === "xxl"
            ? "2xl"
            : it.columnDef.meta?.maxBreakpoint;

        // 🚨 Tailwind does not generate CSS for dynamically constructed class names.
        const classes = {
          hidden: false,
          "xxs:table-cell": false,
          "xs:table-cell": false,
          "sm:table-cell": false,
          "md:table-cell": false,
          "lg:table-cell": false,
          "xl:table-cell": false,
          "2xl:table-cell": false,
          "xxs:hidden": false,
          "xs:hidden": false,
          "sm:hidden": false,
          "md:hidden": false,
          "lg:hidden": false,
          "xl:hidden": false,
          "2xl:hidden": false,
        };
        if (breakpoint !== undefined) {
          classes.hidden = true;
          classes[`${breakpoint}:table-cell`] = true;
        }
        if (maxBreakpoint !== undefined) {
          classes[`${maxBreakpoint}:hidden`] = true;
        }
        return [it.id, classes];
      }),
    );
  });

  return (
    <Show
      when={table.getRowModel().rows?.length || props.noDataRow !== undefined}
      fallback={props.fallback}
    >
      <Table id={props.id} class={props.class}>
        <Show when={!props.hideHeader}>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <Show
                        when={header.column.getCanSort()}
                        fallback={
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
                              columnVisibility()[header.column.id],
                              props.headerCellClass,
                            )}
                            {...(header.column.columnDef.meta?.headerMeta ??
                              {})}
                          >
                            <Show when={!header.isPlaceholder}>
                              <FlexRender header={header} />
                            </Show>
                          </TableHead>
                        }
                      >
                        <TableHead
                          colSpan={header.colSpan}
                          aria-sort={
                            header.column.getIsSorted() === "asc"
                              ? "ascending"
                              : header.column.getIsSorted() === "desc"
                                ? "descending"
                                : "none"
                          }
                          class={cn(
                            "p-0",
                            columnVisibility()[header.column.id],
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
                              props.headerCellClass,
                              header.column.columnDef.meta?.headerClass,
                            )}
                            {...(header.column.columnDef.meta?.headerMeta ??
                              {})}
                          >
                            <Show when={!header.isPlaceholder}>
                              <FlexRender header={header} />
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
                      </Show>
                    )}
                  </For>
                </TableRow>
              )}
            </For>
          </TableHeader>
        </Show>
        <TableBody>
          <For each={table.getRowModel().rows}>
            {(row) => {
              let rowElement: HTMLTableRowElement | undefined;
              // a recreated table recreates rows with the same id: keep the newest
              onCleanup(() => {
                if (rowElements.get(row.id) === rowElement) {
                  rowElements.delete(row.id);
                }
              });
              return (
                <TableRow
                  ref={(el) => {
                    rowElement = el;
                    rowElements.set(row.id, el);
                  }}
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
                        typeof cell.column.columnDef.meta?.cellMeta ===
                          "function"
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
                                (cell.column.columnDef.meta?.align ??
                                  "left") === "left",
                              "text-center":
                                cell.column.columnDef.meta?.align === "center",
                              "text-right":
                                cell.column.columnDef.meta?.align === "right",
                            },
                            columnVisibility()[cell.column.id],
                            props.bodyCellClass,
                            cellClass.class,
                          )}
                        >
                          <FlexRender cell={cell} />
                        </TableCell>
                      );
                    }}
                  </For>
                </TableRow>
              );
            }}
          </For>
          <Show
            when={
              !table.getRowModel().rows?.length && props.noDataRow !== undefined
            }
          >
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                class="text-center text-sub"
              >
                {props.noDataRow !== undefined &&
                  (props.noDataRow === true
                    ? "No data"
                    : props.noDataRow.content)}
              </TableCell>
            </TableRow>
          </Show>
        </TableBody>
      </Table>
    </Show>
  );
}
