import "@tanstack/solid-table";
import type { JSX } from "solid-js";
import { BreakpointKey } from "../signals/breakpoints";

declare module "@tanstack/solid-table" {
  //This needs to be an interface
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * define minimal breakpoint for the column to be visible.
     * If not set, the column is always visible
     */
    breakpoint?: BreakpointKey;

    /**
     * additional attributes to be set on the table cell.
     * Can be used to define mouse-overs with `aria-label` and `data-balloon-pos`
     */
    cellMeta?:
      | JSX.HTMLAttributes<HTMLTableCellElement>
      | ((ctx: {
          value: TValue;
          row: TData;
        }) => JSX.HTMLAttributes<HTMLTableCellElement>);

    /**
     * additional attributes to be set on the header if it is sortable
     * Can be used to define mouse-overs with `aria-label` and `data-balloon-pos`
     */
    sortableHeaderMeta?: JSX.HTMLAttributes;
  }
}
