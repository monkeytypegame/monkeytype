import { animate } from "animejs";
import { createEffect, JSXElement, onCleanup } from "solid-js";

import {
  getLoadingPageBarTarget,
  getLoadingPageIndicator,
  getLoadingPageText,
} from "../../states/loading-page";
import { getLoadingError } from "../../states/router";
import { cn } from "../../utils/cn";
import { Fa } from "../common/Fa";

export function LoadingPage(): JSXElement {
  let fillEl: HTMLElement | undefined;

  createEffect(() => {
    const target = getLoadingPageBarTarget();
    if (target === null || fillEl === undefined) return;

    const animation = animate(fillEl, {
      width: `${target.percentage}%`,
      duration: target.durationMs,
    });

    // a newer target supersedes this tween - stop it so the two don't fight
    // over the fill width
    onCleanup(() => animation.pause());
  });

  const shown = (): "spinner" | "bar" | "error" =>
    getLoadingError() !== null ? "error" : getLoadingPageIndicator();
  const text = (): string | null => getLoadingError() ?? getLoadingPageText();
  const spinnerClass = (): string =>
    cn("text-[2rem] text-main", { hidden: shown() !== "spinner" });
  const errorClass = (): string =>
    cn("text-[2rem] text-error", { hidden: shown() !== "error" });
  const barClass = (): string =>
    cn("h-2 w-full max-w-80 justify-self-center rounded bg-sub-alt", {
      hidden: shown() !== "bar",
    });
  const textClass = (): string => cn("h-[1.25em]", { hidden: text() === null });

  // everything stays mounted and is toggled rather than swapped out, so the bar
  // fill keeps its width between loads and is always there to animate
  return (
    <>
      <div class={spinnerClass()}>
        <Fa icon="fa-circle-notch" fixedWidth spin />
      </div>
      <div class={errorClass()}>
        <Fa icon="fa-times" fixedWidth />
      </div>
      <div class={barClass()}>
        <div
          ref={(el) => (fillEl = el)}
          class="h-full w-1/2 rounded bg-main"
        ></div>
      </div>
      {/* innerHTML because load errors can contain <br> separated messages */}
      {/* oxlint-disable-next-line solid/no-innerhtml */}
      <div class={textClass()} innerHTML={text() ?? ""}></div>
    </>
  );
}
