import { Accessor, JSXElement } from "solid-js";

export function LiveCounter(props: {
  value: Accessor<number | string>;
}): JSXElement {
  return <div>{props.value()}</div>;
}
