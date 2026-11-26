import { JSXElement, onCleanup, onMount } from "solid-js";

/** Stops space from scrolling the page when nothing focusable has focus. */
export function PreventSpaceScroll(): JSXElement {
  const onKeydown = (e: KeyboardEvent): void => {
    if (
      e.code === "Space" &&
      (e.target === document.body || (e.target as HTMLElement)?.id === "result")
    ) {
      e.preventDefault();
    }
  };

  onMount(() => {
    window.addEventListener("keydown", onKeydown);
  });
  onCleanup(() => window.removeEventListener("keydown", onKeydown));

  return null;
}
