import { Column } from "@tanstack/solid-table";
import {
  ComponentProps,
  JSXElement,
  Match,
  Show,
  splitProps,
  Switch,
} from "solid-js";

import { cn } from "../../../utils/cn";

type TableColumnHeaderProps<TData, TValue> = ComponentProps<"button"> & {
  column: Column<TData, TValue>;
  title: string;
};

export function TableColumnHeader<TData, TValue>(
  props: TableColumnHeaderProps<TData, TValue>,
): JSXElement {
  const [local, others] = splitProps(props, ["column", "title", "class"]);

  return (
    <Show when={local.column.getCanSort()} fallback={local.title}>
      <button
        type="button"
        role="button"
        onClick={(e) => {
          local.column.getToggleSortingHandler()?.(e);
        }}
        class={cn(
          "text-sub hover:bg-sub-alt box-border flex h-full w-full cursor-pointer items-start justify-start rounded-none border-0 bg-transparent p-2 text-left font-normal whitespace-nowrap",
          local.class,
        )}
        {...others}
      >
        {local.title}

        <Switch fallback={<i class="fas fa-fw" aria-hidden="true"></i>}>
          <Match when={local.column.getIsSorted() === "asc"}>
            <i class="fas fa-fw fa-sort-up" aria-hidden="true"></i>
          </Match>
          <Match when={local.column.getIsSorted() === "desc"}>
            <i class="fas fa-fw fa-sort-down" aria-hidden="true"></i>
          </Match>
        </Switch>
      </button>
    </Show>
  );
}
