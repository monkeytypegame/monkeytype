import { Accessor, JSXElement, Show } from "solid-js";

export function Conditional<T>(props: {
  if: T;
  then: JSXElement | ((value: Accessor<NonNullable<T>>) => JSXElement);
  else?: JSXElement;
}): JSXElement {
  return (
    <Show when={props.if} fallback={props.else}>
      {typeof props.then === "function"
        ? props.then
        : () => props.then as JSXElement}
    </Show>
  );
}
