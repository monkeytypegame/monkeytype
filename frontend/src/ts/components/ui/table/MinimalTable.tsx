import { CollectionStatus } from "@tanstack/db";
import { createSolidTable, getCoreRowModel } from "@tanstack/solid-table";
import { Accessor, createEffect, createMemo, JSXElement } from "solid-js";

import { AnyColumnDef } from "./DataTable";

export function MiniDataTable<T>(props: {
  data: Accessor<T[]> & { isReady: boolean; status: CollectionStatus };
  // oxlint-disable-next-line typescript/no-explicit-any
  columns: AnyColumnDef<T, any>[];
}): JSXElement {
  const data = createMemo(() => props.data());
  const table = createSolidTable({
    get data() {
      return data();
    },
    get columns() {
      return [];
    },
    getCoreRowModel: getCoreRowModel(),
  });
  createEffect(() => {
    // Force table to update when data changes
    table.setOptions((prev) => ({ ...prev, data: data() }));

    console.log("data:", data().length);
    console.log("table data:", table.options.data.length);
    console.log("rows:", table.getRowModel().rows.length);
  });

  return (
    <pre>
      status: {props.data.status}
      len: {props.data().length}
      rows: {table.getRowModel().rows.length}
    </pre>
  );
}
