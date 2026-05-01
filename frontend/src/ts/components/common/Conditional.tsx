import { Accessor, JSXElement, Show } from "solid-js";

export function Conditional<T>(props: {
  if: T;
  then: JSXElement | ((value: Accessor<NonNullable<T>>) => JSXElement);
  else?: JSXElement;
}): JSXElement {
  return (
    <Show when={props.if} fallback={props.else}>
      {(value) => {
        // Access props.then once inside Show's children to avoid:
        // 1. Eager evaluation when `if` is false
        // 2. Double getter evaluation from typeof + usage
        const thenValue = props.then;
        return typeof thenValue === "function" ? thenValue(value) : thenValue;
      }}
    </Show>
  );
}
