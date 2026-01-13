import { JSXElement, Show } from "solid-js";

export function Anchor(props: {
  text?: string;
  icon?: string;
  class?: string;
  type: "text" | "button";
  href: string;
  children?: JSXElement;
}): JSXElement {
  return (
    <a
      type="button"
      classList={{
        [props.type === "text" ? "textButton" : "button"]: true,
        [props.class ?? ""]: props.class !== undefined,
      }}
      href={props.href}
      target="_blank"
      rel="noreferrer noopener"
    >
      <Show when={props.icon !== undefined}>
        <i
          class={props.icon}
          classList={{
            "fa-fw": props.text === undefined,
          }}
        ></i>
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </a>
  );
}
