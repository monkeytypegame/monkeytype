import { JSXElement, Show } from "solid-js";

export function TextButton(props: {
  icon?: string;
  class?: string;
  onClick?: () => void;
  children: JSXElement;
}): JSXElement {
  return (
    <button
      type="button"
      classList={{
        textButton: props.class === undefined,
        [props.class ?? ""]: props.class !== undefined,
      }}
      onClick={() => props.onClick?.()}
    >
      <Show when={props.icon !== undefined}>
        <i class={`fas fa-fw ${props.icon}`}></i>
      </Show>
      {props.children}
    </button>
  );
}
