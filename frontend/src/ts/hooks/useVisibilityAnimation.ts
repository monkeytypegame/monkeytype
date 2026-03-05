import { Accessor, createEffect, onCleanup } from "solid-js";
import { AnimationParams, JSAnimation } from "animejs";
import { ElementWithUtils } from "../utils/dom";
import { applyReducedMotion } from "../utils/misc";

export function useVisibilityAnimation(options: {
  element: Accessor<ElementWithUtils | undefined>;
  isVisible: Accessor<boolean>;
  showAnimationOptions?: AnimationParams;
  hideAnimationOptions?: AnimationParams;
}): void {
  let showAnimation: undefined | JSAnimation = undefined;
  let hideAnimation: undefined | JSAnimation = undefined;

  createEffect(() => {
    const el = options.element();
    const visible = options.isVisible();

    if (!el) return;

    if (visible) {
      hideAnimation?.pause();
      showAnimation = el.animate({
        opacity: 1,
        duration: applyReducedMotion(125),
        ...options.showAnimationOptions,
        onBegin: (self) => {
          el.show();
          options.showAnimationOptions?.onBegin?.(self);
        },
      });
    } else {
      showAnimation?.pause();
      hideAnimation = el.animate({
        opacity: 0,
        duration: applyReducedMotion(125),
        ...options.hideAnimationOptions,
        onComplete: (self) => {
          el.hide();
          options.hideAnimationOptions?.onComplete?.(self);
        },
      });
    }

    onCleanup(() => {
      showAnimation?.pause();
      hideAnimation?.pause();
    });
  });
}
