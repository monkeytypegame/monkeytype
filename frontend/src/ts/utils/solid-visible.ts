import { Accessor, createEffect } from "solid-js";
import { ElementWithUtils } from "./dom";
import { applyReducedMotion } from "./misc";
import { VisibleDirectiveProps } from "../types/solid-directives";

export function visible(
  el: HTMLElement,
  accessorWrapper: Accessor<VisibleDirectiveProps>,
): void {
  const divUtil = new ElementWithUtils(el);

  createEffect(() => {
    const state = accessorWrapper()();

    if (state.value) {
      if (state.withAnimation) {
        divUtil.animate({
          opacity: [0, 1],
          duration: applyReducedMotion(1250),
        });
      } else {
        divUtil.setStyle({ opacity: "1" });
      }
    } else {
      if (state.withAnimation) {
        divUtil.animate({
          opacity: [1, 0],
          duration: applyReducedMotion(1250),
        });
      } else {
        divUtil.setStyle({ opacity: "0" });
      }
    }
  });
}
