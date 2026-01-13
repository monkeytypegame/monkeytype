import { JSXElement, Show } from "solid-js";

export function Button(props: {
  text?: string;
  icon?: string;
  class?: string;
  type: "text" | "button";
  onClick?: () => void;
  children?: JSXElement;
}): JSXElement {
  return (
    <button
      type="button"
      classList={{
        [props.type === "text" ? "textButton" : "button"]: true,
        [props.class ?? ""]: props.class !== undefined,
      }}
      onClick={() => props.onClick?.()}
    >
      <Show when={props.icon !== undefined}>
        <i
          class={`fas ${props.icon}`}
          classList={{
            "fa-fw": props.text === undefined,
          }}
        ></i>
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </button>
  );
}
