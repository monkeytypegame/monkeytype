import { Accessor, createEffect } from "solid-js";
import { ElementWithUtils } from "../utils/dom";

export function useVisibilityAnimation(
  element: () => ElementWithUtils<HTMLDivElement> | undefined,
  visible: Accessor<{
    value: boolean;
    withAnimation: boolean;
  }>,
  additionalCondition?: Accessor<boolean>,
): void {
  createEffect(() => {
    const el = element();
    if (!el) return;

    const visibleState = visible();
    const shouldShow = additionalCondition
      ? visibleState.value && additionalCondition()
      : visibleState.value;

    if (shouldShow) {
      if (visibleState.withAnimation) {
        el.animate({
          opacity: [0, 1],
          duration: 125,
        });
      } else {
        el.setStyle({ opacity: "1" });
      }
    } else {
      if (visibleState.withAnimation) {
        el.animate({
          opacity: [1, 0],
          duration: 125,
        });
      } else {
        el.setStyle({ opacity: "0" });
      }
    }
  });
}
