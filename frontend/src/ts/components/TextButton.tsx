import { Accessor, JSXElement } from "solid-js";

export function TextButton(props: {
  text: string | Accessor<string>;
  icon: string | Accessor<string>;
  onClick?: () => void;
}): JSXElement {
  const text = (): string =>
    typeof props.text === "function" ? props.text() : props.text;

  const icon = (): string =>
    typeof props.icon === "function" ? props.icon() : props.icon;

  return (
    <button type="button" class="textButton" onClick={props.onClick}>
      <i class={`fas fa-fw ${icon()}`}></i>
      <div class="text">{text()}</div>
    </button>
  );
}
