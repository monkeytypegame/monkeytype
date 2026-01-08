import { createEffect } from "solid-js";
import { ElementWithUtils } from "./dom";
import { applyReducedMotion } from "./misc";
import { isFocused } from "../test/focus";
import { VisibleDirectiveProps } from "../types/solid-directives";

export function visible(
  el: HTMLElement,
  isVisible: VisibleDirectiveProps,
): void {
  const divUtil = new ElementWithUtils(el);

  createEffect(() => {
    const visibleState = isVisible();
    const focusState = isFocused();
    if (visibleState.value && focusState) {
      if (visibleState.withAnimation) {
        divUtil.animate({
          opacity: [0, 1],
          duration: applyReducedMotion(1250),
        });
      } else {
        divUtil.setStyle({ opacity: "1" });
      }
    } else {
      if (visibleState.withAnimation) {
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
