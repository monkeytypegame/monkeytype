import { Accessor, createEffect, JSXElement } from "solid-js";
import { animate } from "animejs";
import { isFocused } from "./focus";

export function LiveCounter(props: {
  value: Accessor<string>;
  visible: Accessor<{
    value: boolean;
    withAnimation: boolean;
  }>;
  class?: string;
}): JSXElement {
  let divRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (divRef === undefined) return;
    const visibleState = props.visible();
    const focusState = isFocused();
    if (visibleState.value && focusState) {
      if (visibleState.withAnimation) {
        animate(divRef, {
          opacity: [0, 1],
          duration: 125,
        });
      } else {
        divRef.style.opacity = "1";
      }
    } else {
      if (visibleState.withAnimation) {
        animate(divRef, {
          opacity: [1, 0],
          duration: 125,
        });
      } else {
        divRef.style.opacity = "0";
      }
    }
  });

  return (
    <div ref={divRef} class={`${props.class}`}>
      {props.value()}
    </div>
  );
}
