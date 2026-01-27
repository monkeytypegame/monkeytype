import { JSXElement, Show } from "solid-js";

export function Conditional(props: {
  if: boolean;
  then: JSXElement;
  else?: JSXElement;
}): JSXElement {
  return (
    <Show when={props.if} fallback={props.else}>
      {props.then}
    </Show>
  );
}
