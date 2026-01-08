import { Accessor, JSXElement } from "solid-js";
import { VisibleDirectiveProps } from "../types/solid-directives";

export function LiveCounter(props: {
  value: Accessor<string>;
  visible?: VisibleDirectiveProps;
  class?: string;
}): JSXElement {
  return (
    <div class={`${props.class}`} use:visible={props.visible}>
      {props.value()}
    </div>
  );
}
