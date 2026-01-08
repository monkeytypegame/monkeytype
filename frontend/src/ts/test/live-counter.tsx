import { Accessor, JSXElement } from "solid-js";
import { VisibleDirectiveProps } from "../types/solid-directives";

import { visible } from "../utils/solid-visible";
// oxlint-disable-next-line no-unused-expressions no-constant-binary-expression
false && visible; // Prevents tree-shaking

export function LiveCounter(props: {
  value: Accessor<string>;
  visible?: VisibleDirectiveProps;
  class?: string;
}): JSXElement {
  return (
    <div class={props.class} use:visible={props.visible}>
      {props.value()}
    </div>
  );
}
