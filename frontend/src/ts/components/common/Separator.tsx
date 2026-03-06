import { JSXElement } from "solid-js";

import { cn } from "../../utils/cn";

export function Separator(props: { class?: string }): JSXElement {
  return (
    <div class={cn(`h-1 w-full rounded bg-sub-alt ${props.class ?? ""}`)}></div>
  );
}
