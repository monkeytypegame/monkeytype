import { animate } from "animejs";
import { createEffect, JSXElement, onCleanup, onMount, Show } from "solid-js";

import {
  getLoadingPageBarStart,
  getLoadingPageBarTarget,
  getLoadingPageText,
  isLoadingBarShown,
} from "../../states/loading-page";
import { cn } from "../../utils/cn";
import { Button } from "../common/Button";
import { Fa } from "../common/Fa";

export type LoadingPageProps = {
  /** Shows the error state: the failed load's message and a Retry button. */
  error?: { message: string; onRetry: () => void };
};

export function LoadingPage(props: LoadingPageProps): JSXElement {
  let fillEl: HTMLElement | undefined;

  // the loading page can mount mid-navigation (after the old page faded
  // out): start where the current step's share begins
  onMount(() => {
    if (fillEl !== undefined) {
      fillEl.style.width = `${getLoadingPageBarStart()}%`;
    }
  });

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

  const indicator = (): "spinner" | "bar" | "error" =>
    props.error !== undefined
      ? "error"
      : isLoadingBarShown()
        ? "bar"
        : "spinner";
  const text = (): string | null =>
    props.error?.message ?? getLoadingPageText();
  const spinnerClass = (): string =>
    cn("text-[2rem] text-main", { hidden: indicator() !== "spinner" });
  const errorClass = (): string =>
    cn("text-[2rem] text-error", { hidden: indicator() !== "error" });
  const barClass = (): string =>
    cn("h-2 w-full max-w-80 justify-self-center rounded bg-sub-alt", {
      hidden: indicator() !== "bar",
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
        <div ref={(el) => (fillEl = el)} class="h-full rounded bg-main"></div>
      </div>
      {/* innerHTML because load errors can contain <br> separated messages */}
      {/* oxlint-disable-next-line solid/no-innerhtml */}
      <div class={textClass()} innerHTML={text() ?? ""}></div>
      <Show when={props.error}>
        {(error) => (
          <Button
            fa={{ icon: "fa-redo-alt" }}
            text="Retry"
            class="justify-self-center"
            onClick={() => error().onRetry()}
          />
        )}
      </Show>
    </>
  );
}
