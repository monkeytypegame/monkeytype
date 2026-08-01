import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, For, JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export type ButtonGroupOption<T> = { value: T; label: string };

export function ButtonGroup<T>(props: {
  field: Accessor<AnyFieldApi>;
  options: readonly ButtonGroupOption<T>[];
  class?: string;
  disabled?: boolean;
}): JSXElement {
  return (
    <div
      class={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2",
        props.class,
      )}
    >
      <For each={props.options}>
        {(option) => (
          <Button
            active={props.field().state.value === option.value}
            disabled={props.disabled}
            onClick={() => props.field().handleChange(option.value)}
          >
            {option.label}
          </Button>
        )}
      </For>
    </div>
  );
}
