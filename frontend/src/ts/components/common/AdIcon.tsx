import { JSXElement } from "solid-js";

import { cn } from "../../utils/cn";
import { Fa } from "./Fa";

/** Placeholder shown in an ad slot until (or unless) an ad fills it. */
export function AdIcon(props: { small?: boolean; class?: string }): JSXElement {
  return (
    <div
      class={cn(
        "grid h-full w-full items-center justify-center text-[3rem] text-sub",
        { "text-[1.5rem]": props.small },
        props.class,
      )}
    >
      <Fa icon="fa-ad" />
    </div>
  );
}
