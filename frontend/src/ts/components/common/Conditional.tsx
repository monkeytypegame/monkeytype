import { Accessor, JSXElement, Show } from "solid-js";

export function Conditional<T>(props: {
  if: T;
  then: JSXElement | ((value: Accessor<NonNullable<T>>) => JSXElement);
  else?: JSXElement;
}): JSXElement {
  // oxlint-disable-next-line solid/reactivity -- intentional: cache to avoid double getter evaluation
  const thenValue = props.then;
  return (
    <Show when={props.if} fallback={props.else}>
      {/* oxlint-disable-next-line solid/prefer-show -- intentional: handle function or JSXElement */}
      {typeof thenValue === "function" ? thenValue : () => thenValue}
    </Show>
  );
}
