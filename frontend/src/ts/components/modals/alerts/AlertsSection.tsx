import { JSXElement } from "solid-js";

export function AlertsSection(props: {
  title: JSXElement;
  body: JSXElement;
}): JSXElement {
  return (
    <div>
      <div class="flex text-xl">{props.title}</div>
      <div class="grid min-h-20 items-center gap-4">{props.body}</div>
    </div>
  );
}
