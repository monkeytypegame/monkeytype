import { JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";

export function LabeledField(props: {
  label: string;
  sub?: string;
  id?: string;
  children: JSXElement;
  class?: string;
}): JSXElement {
  return (
    <div class={cn("grid gap-1", props.class)}>
      <label for={props.id} class="text-sub cursor-pointer lowercase">
        {props.label}
      </label>
      {props.sub && <div class="mb-1 text-xs text-sub">{props.sub}</div>}
      {props.children}
    </div>
  );
}
