import { Key } from "@solid-primitives/keyed";
import {
  ColumnDef,
  createSolidTable,
  getCoreRowModel,
  Row,
} from "@tanstack/solid-table";
import { Accessor, Component, JSXElement } from "solid-js";

import { AnyColumnDef } from "./DataTable";

export type TableProps<TData> = {
  // oxlint-disable-next-line typescript/no-explicit-any
  columnDefs: ColumnDef<any>[];
  query: Accessor<TData[]>;
};

export function MiniTable<TData>(props: {
  query: Accessor<TData[]>;
  // oxlint-disable-next-line typescript/no-explicit-any
  columns: AnyColumnDef<TData, any>[];
}): JSXElement {
  const table = createSolidTable({
    get data() {
      return props.query();
    },
    get columns() {
      return props.columns;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      minitable {table.getRowCount()}
      <table>
        <thead></thead>
        <tbody>
          <Key each={table.getRowModel().rows} by={(r) => r.original.id}>
            {(row) => <TableRow row={row()} />}
          </Key>
        </tbody>
      </table>
    </>
  );
}

export type RowProps = {
  // oxlint-disable-next-line typescript/no-explicit-any
  row: Row<any>;
};

export const TableRow: Component<RowProps> = (props: RowProps) => {
  console.log("TableRow Function");
  return (
    <tr>
      <Key each={props.row.getVisibleCells()} by={(c) => c.id}>
        {(cell) => (
          <td>
            <Cell text={cell().getValue() as string} />
          </td>
        )}
      </Key>
    </tr>
  );
};

export type CellProps = {
  text: string;
};

export const Cell: Component<CellProps> = (props) => {
  console.log("Cell Component Function");
  return <span>{props.text}</span>;
};
