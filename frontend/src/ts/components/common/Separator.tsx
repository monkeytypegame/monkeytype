import { JSXElement, Show } from "solid-js";

import { cn } from "../../utils/cn";

export function Separator(props: {
  class?: string;
  vertical?: true;
  text?: string;
}): JSXElement {
  return (
    <Show
      when={props.text !== undefined}
      fallback={
        <div
          class={cn(
            props.vertical ? "h-full w-1" : "h-1 w-full",
            `rounded bg-sub-alt`,
            props.class,
          )}
        ></div>
      }
    >
      <div
        class={cn(
          "flex place-items-center gap-4",
          props.vertical ? "flex-col" : "flex-row",
          props.class,
        )}
      >
        <div
          class={cn(
            props.vertical ? "h-full w-1" : "h-1 w-full",
            `rounded bg-sub-alt`,
          )}
        ></div>
        <div>{props.text}</div>
        <div
          class={cn(
            props.vertical ? "h-full w-1" : "h-1 w-full",
            `rounded bg-sub-alt`,
          )}
        ></div>
      </div>
    </Show>
  );
}
