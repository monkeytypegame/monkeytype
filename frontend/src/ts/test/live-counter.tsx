import { Accessor, JSXElement } from "solid-js";

export function LiveCounter(props: { value: Accessor<number> }): JSXElement {
  return <div>{props.value()}</div>;
}
