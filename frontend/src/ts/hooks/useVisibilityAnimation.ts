import { Accessor, createEffect } from "solid-js";
import { ElementWithUtils } from "../utils/dom";

export function useVisibilityAnimation(options: {
  element: Accessor<ElementWithUtils<HTMLDivElement> | undefined>;
  visible: Accessor<boolean>;
  animate?: Accessor<boolean>;
}): void {
  const { element, visible, animate = () => true } = options;
  createEffect(() => {
    const el = element();
    if (!el) return;
    if (visible()) {
      if (animate()) {
        el.animate({
          opacity: [0, 1],
          duration: 125,
        });
      } else {
        el.setStyle({ opacity: "1" });
      }
    } else {
      if (animate()) {
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
