import { Accessor, JSXElement } from "solid-js";

export function LiveCounter(props: {
  value: Accessor<string>;
  class?: string;
}): JSXElement {
  return (
    <div class={`${props.class}`} classList={{ hidden: props.value() === "" }}>
      {props.value()}
    </div>
  );
}
