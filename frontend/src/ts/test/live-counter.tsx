import { Accessor, JSXElement } from "solid-js";
import { VisibleDirectiveProps } from "../types/solid-directives";
import { visible } from "../utils/solid-visible";

export function LiveCounter(props: {
  value: Accessor<string>;
  visible?: VisibleDirectiveProps;
  class?: string;
}): JSXElement {
  console.log("### counter", { visible: props.visible?.() });
  return (
    <div class={props.class} use:visible={props.visible}>
      {props.value()}
    </div>
  );
}
