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
import { createMemo, For, JSXElement, Match, Show, Switch } from "solid-js";
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

export type AnyColumnDef<TData, TValue = unknown> =
  | ColumnDef<TData, TValue>
  | AccessorFnColumnDef<TData, TValue>
  | AccessorKeyColumnDef<TData, TValue>;

type DataTableProps<TData, TValue> = {
  id: string;
  columns: AnyColumnDef<TData, TValue>[];
  data: TData[];
  fallback?: JSXElement;
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
        const id =
          col.id ??
          ("accessorKey" in col && col.accessorKey !== null
            ? String(col.accessorKey)
            : `__col_${index}`);

        return [id, current[col.meta?.breakpoint ?? "xxs"]];
      }),
    );

    return result;
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
    state: {
      get sorting() {
        return sorting();
      },
      get columnVisibility() {
        return columnVisibility();
      },
    },
  });

  return (
    <Show when={table.getRowModel().rows?.length} fallback={props.fallback}>
      <Table>
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
                            class="text-sub hover:bg-sub-alt m-0 box-border flex h-full w-full cursor-pointer items-start justify-start rounded-none border-0 bg-transparent p-2 text-left font-normal whitespace-nowrap"
                            {...(header.column.columnDef.meta
                              ?.sortableHeaderMeta ?? {})}
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
                        <TableHead colSpan={header.colSpan}>
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
        <TableBody>
          <For each={table.getRowModel().rows}>
            {(row) => (
              <TableRow data-state={row.getIsSelected() && "selected"}>
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
                      <TableCell {...cellMeta}>
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
