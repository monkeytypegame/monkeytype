import { JSXElement, Show } from "solid-js";

import { cn } from "../../../utils/cn";

export function LabeledField(props: {
  label: string;
  subLabel?: string;
  id?: string;
  children: JSXElement;
  class?: string;
}): JSXElement {
  return (
    <div class={cn("grid gap-1", props.class)}>
      <label
        // oxlint-disable-next-line react/no-unknown-property
        for={props.id}
        class="text-sub lowercase"
      >
        {props.label}
      </label>
      <Show when={props.subLabel}>
        <div class="mb-1 text-em-xs text-sub opacity-50">{props.subLabel}</div>
      </Show>
      {props.children}
    </div>
  );
}
