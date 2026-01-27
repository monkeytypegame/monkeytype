import type { Component, ComponentProps } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "../../../utils/cn";

const Table: Component<ComponentProps<"table">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <table
      class={cn("w-full border-separate border-spacing-0", local.class)}
      {...others}
    ></table>
  );
};

const TableHeader: Component<ComponentProps<"thead">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <thead
      class={cn("text-xs [&>tr]:bg-none", local.class)}
      {...others}
    ></thead>
  );
};

const TableBody: Component<ComponentProps<"tbody">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <tbody
      class={cn(
        "[&>tr]:odd:bg-sub-alt text-xs md:text-sm lg:text-base",
        local.class,
      )}
      {...others}
    ></tbody>
  );
};

const TableFooter: Component<ComponentProps<"tfoot">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <tfoot class={cn("", local.class)} {...others}></tfoot>;
};

const TableRow: Component<ComponentProps<"tr">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <tr
      class={cn("[&>td]:first:rounded-l [&>td]:last:rounded-r", local.class)}
      {...others}
    ></tr>
  );
};

const TableHead: Component<ComponentProps<"th">> = (props) => {
  const [local, others] = splitProps(props, ["class", "aria-label"]);
  return (
    <th
      aria-label={local["aria-label"]}
      class={cn(
        "text-sub has-button:p-0 appearance-none p-2 text-left align-bottom text-xs font-normal",
        local.class,
      )}
      {...others}
    ></th>
  );
};

const TableCell: Component<ComponentProps<"td">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <td class={cn("appearance-none p-2", local.class)} {...others}></td>;
};

const TableCaption: Component<ComponentProps<"caption">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <caption class={cn("", local.class)} {...others}></caption>;
};

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
