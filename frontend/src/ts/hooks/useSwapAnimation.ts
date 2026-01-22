import { Accessor, createEffect, createSignal } from "solid-js";
import { createEffectOn } from "./effects";
import { ElementWithUtils } from "../utils/dom";
import { JSAnimation } from "animejs";

type Options<T extends Record<string, Accessor<ElementWithUtils | undefined>>> =
  {
    elements: T;
    initial: keyof T;
  };

type Return<T extends Record<string, Accessor<ElementWithUtils | undefined>>> =
  {
    setVisibleElement: (element: keyof T) => void;
  };

const TOTAL_DURATION = 250;

export function useSwapAnimation<
  T extends Record<string, Accessor<ElementWithUtils | undefined>>,
>(options: Options<T>): Return<T> {
  const [getVisible, setVisible] = createSignal<keyof T>(options.initial);
  let runningAnimation: JSAnimation | null = null;

  // Initially hide all elements except the initial one once they're available
  createEffect(() => {
    for (const [key, element] of Object.entries(options.elements)) {
      if (key === options.initial) {
        element()?.removeClass("hidden");
      } else {
        element()?.addClass("hidden").setStyle({ opacity: "0" });
      }
    }
  });

  createEffectOn(getVisible, async (visible, previousVisible) => {
    const prevEl =
      previousVisible !== undefined
        ? options.elements[previousVisible]?.()
        : null;
    const newEl = options.elements[visible]?.();

    if (
      prevEl === undefined ||
      newEl === undefined ||
      prevEl === null ||
      newEl === null
    ) {
      return;
    }

    if (runningAnimation !== null) {
      runningAnimation.pause();
    }

    if (prevEl.hasClass("hidden")) {
      //if it already is hidden, just show the new one
      runningAnimation = newEl.removeClass("hidden").animate({
        opacity: 1,
        duration: TOTAL_DURATION,
      });
    } else {
      runningAnimation = prevEl.animate({
        opacity: 0,
        duration: TOTAL_DURATION / 2,
        onComplete: () => {
          prevEl.addClass("hidden");
          newEl.removeClass("hidden").animate({
            opacity: [0, 1],
            duration: TOTAL_DURATION / 2,
          });
        },
      });
    }
  });

  return {
    setVisibleElement: setVisible,
  };
}
