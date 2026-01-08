import { Accessor, createEffect, JSXElement, onMount } from "solid-js";
import { ElementWithUtils } from "../utils/dom";
import { isFocused } from "./focus";

export function LiveCounter(props: {
  value: Accessor<string>;
  visible: Accessor<{
    value: boolean;
    withAnimation: boolean;
  }>;
  class?: string;
}): JSXElement {
  // oxlint-disable-next-line no-unassigned-vars
  let divRef: HTMLDivElement | undefined;
  let divUtil: ElementWithUtils<HTMLDivElement> | undefined;

  onMount(() => {
    if (divRef) {
      divUtil = new ElementWithUtils(divRef);
    }
  });

  createEffect(() => {
    if (divUtil === undefined) return;
    const visibleState = props.visible();
    const focusState = isFocused();
    if (visibleState.value && focusState) {
      if (visibleState.withAnimation) {
        divUtil.animate({
          opacity: [0, 1],
          duration: 125,
        });
      } else {
        divUtil.setStyle({ opacity: "1" });
      }
    } else {
      if (visibleState.withAnimation) {
        divUtil.animate({
          opacity: [1, 0],
          duration: 125,
        });
      } else {
        divUtil.setStyle({ opacity: "0" });
      }
    }
  });

  return (
    <div ref={divRef} class={`${props.class}`}>
      {props.value()}
    </div>
  );
}
