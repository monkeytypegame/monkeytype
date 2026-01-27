import {
  AccessorKeyColumnDef,
  ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/solid-table";
import { Accessor, createMemo, For, JSXElement, Show } from "solid-js";
import { z } from "zod";

import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { bp } from "../../../signals/breakpoints";

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

export type AnyColumnDef<TData, TValue> =
  | ColumnDef<TData, TValue>
  //  | AccessorFnColumnDef<TData, TValue>
  | AccessorKeyColumnDef<TData, TValue>;

type DataTableProps<TData, TValue> = {
  id: string;
  columns: AnyColumnDef<TData, TValue>[];
  data?: TData[];
  query?: Accessor<TData[]>;
  fallback?: JSXElement;
};

export function DataTable<TData>(
  // oxlint-disable-next-line typescript/no-explicit-any
  props: DataTableProps<TData, any>,
): JSXElement {
  const [sorting, setSorting] = useLocalStorage<SortingState>({
    //oxlint-disable-next-line solid/reactivity
    key: `${props.id}Sort`,
    schema: SortingStateSchema,
    fallback: [],
    //migrate old state from sorted-table
    migrate: (value: Record<string, unknown> | unknown[]) =>
      typeof value === "object" && "property" in value && "descending" in value
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
      props.columns.map((col) => {
        //fill missing columnIds, otherwise hidinc columns will not work
        if (col.id === undefined) {
          if ("accessorKey" in col) {
            col.id = col.accessorKey as string;
          }
        }
        return [col.id as string, current[col.meta?.breakpoint ?? "xxs"]];
      }),
    );

    return result;
  });

  const data = createMemo(() => props.query?.() ?? props.data);
  const table = createSolidTable<TData>({
    get data() {
      return data() ?? [];
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
    <Show when={true} fallback={props.fallback}>
      <br></br>
      length:{table.options.data.length} :{table.options.data.length}
      <For each={table.options.data}>
        {(row) => <div>{`row ${row.initiatorName} - ${row.status}`}</div>}
      </For>
      <Table>
        <TableHeader>
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => (
              <TableRow>
                <For each={headerGroup.headers}>
                  {(header) => (
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
                      <Show when={!header.isPlaceholder}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </Show>
                    </TableHead>
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
