import { JSXElement } from "solid-js";

import { cn } from "../../utils/cn";
import { Fa } from "./Fa";
export function LoadingCircle(props: { class?: string }): JSXElement {
  return (
    <div class={cn("preloader text-main", props.class)}>
      <Fa icon="fa-circle-notch" fixedWidth spin />
    </div>
  );
}
