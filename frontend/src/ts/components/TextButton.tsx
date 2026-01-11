import { JSXElement } from "solid-js";

export function TextButton(props: {
  icon?: string;
  onClick?: () => void;
  children: JSXElement;
}): JSXElement {
  return (
    <button type="button" class="textButton" onClick={props.onClick}>
      {props.icon !== undefined && <i class={`fas fa-fw ${props.icon}`} />}
      {props.children}
    </button>
  );
}
