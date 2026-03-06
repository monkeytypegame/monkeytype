import { JSXElement } from "solid-js";

import { cn } from "../../utils/cn";

export function Separator(props: {
  class?: string;
  vertical?: true;
}): JSXElement {
  return (
    <div
      class={cn(
        props.vertical ? "h-full w-1" : "h-1 w-full",
        `rounded bg-sub-alt`,
        props.class,
      )}
    ></div>
  );
}
