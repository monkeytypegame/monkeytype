import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, For, JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export function ButtonGroup<T>(props: {
  field: Accessor<AnyFieldApi>;
  options: readonly { value: T; label: string }[];
  class?: string;
}): JSXElement {
  return (
    <div class={cn("grid auto-cols-fr grid-flow-col gap-2", props.class)}>
      <For each={props.options}>
        {(option) => (
          <Button
            active={props.field().state.value === option.value}
            onClick={() => props.field().handleChange(option.value)}
          >
            {option.label}
          </Button>
        )}
      </For>
    </div>
  );
}
