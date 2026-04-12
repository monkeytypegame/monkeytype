import { JSXElement } from "solid-js";

export function PageIndicator(props: { currentPage: number }): JSXElement {
  return (
    <span class="inline-flex h-min appearance-none items-center justify-center gap-[0.5em] rounded border-0 p-[0.5em] text-center leading-[1.25] text-(--themable-button-text)">
      Page {props.currentPage + 1}
    </span>
  );
}
