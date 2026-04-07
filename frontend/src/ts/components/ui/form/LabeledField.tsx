import { JSXElement, Show } from "solid-js";

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
      <label
        // oxlint-disable-next-line react/no-unknown-property
        for={props.id}
        class="cursor-pointer text-sub lowercase"
      >
        {props.label}
      </label>
      <Show when={props.sub}>
        <div class="mb-1 text-xs text-sub">{props.sub}</div>
      </Show>
      {props.children}
    </div>
  );
}
