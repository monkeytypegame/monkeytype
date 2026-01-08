import { Accessor, createEffect } from "solid-js";
import { ElementWithUtils } from "../utils/dom";

export type VisibilityAnimationOptions = {
  visible: boolean;
  animate?: boolean;
};

export function useVisibilityAnimation(
  element: Accessor<ElementWithUtils<HTMLDivElement> | undefined>,
  options: Accessor<VisibilityAnimationOptions>,
): void {
  createEffect(() => {
    const el = element();
    const opt = options();
    if (!el) return;
    if (opt.visible) {
      if (opt.animate) {
        el.animate({
          opacity: [0, 1],
          duration: 125,
        });
      } else {
        el.setStyle({ opacity: "1" });
      }
    } else {
      if (opt.animate) {
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
