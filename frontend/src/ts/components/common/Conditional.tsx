import { Accessor, JSXElement, Show } from "solid-js";

export function Conditional<T>(props: {
  if: T;
  then: JSXElement | ((value: Accessor<NonNullable<T>>) => JSXElement);
  else?: JSXElement;
}): JSXElement {
  return (
    <Show when={props.if} fallback={props.else}>
      {(value) =>
        typeof props.then === "function" ? props.then(value) : props.then
      }
    </Show>
  );
}
