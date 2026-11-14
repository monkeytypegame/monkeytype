import { animate } from "animejs";
import { createEffect, JSXElement, onCleanup, onMount, Show } from "solid-js";

import type { FaSolidIcon } from "../../types/font-awesome";

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
  /**
   * Shows the error state: the failed load's message, a Retry button and the
   * fallback's button, if any.
   */
  error?: {
    message: string;
    onRetry: () => void;
    fallback?: { text: string; run: () => void };
    /** Smaller, below the message: eg. the server's reason. */
    detail?: string;
    /** Instead of the cross. */
    icon?: FaSolidIcon;
  };
  /**
   * Always shows the spinner with `text`, never the bar (a page suspending:
   * the bar belongs to the navigation).
   */
  spinner?: { text: string };
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
      : props.spinner === undefined && isLoadingBarShown()
        ? "bar"
        : "spinner";
  // the text belongs to the bar: it stays at "Done" once the bar hid, which
  // the spinner (slow navigation, a page suspending) must not show
  const text = (): string | null =>
    props.error?.message ??
    (indicator() === "bar"
      ? getLoadingPageText()
      : (props.spinner?.text ?? null));
  const spinnerClass = (): string =>
    cn("text-[2rem] text-main", { hidden: indicator() !== "spinner" });
  const errorClass = (): string =>
    cn("text-[2rem] text-error", { hidden: indicator() !== "error" });
  const barClass = (): string =>
    cn("h-2 w-full max-w-80 justify-self-center rounded bg-sub-alt", {
      hidden: indicator() !== "bar",
    });
  const textClass = (): string =>
    cn("min-h-[1.25em]", { hidden: text() === null });

  // everything stays mounted and is toggled rather than swapped out, so the bar
  // fill keeps its width between steps and is always there to animate
  return (
    <div class="grid h-full w-full content-center items-center gap-4 place-self-center text-center">
      <div class={spinnerClass()}>
        <Fa icon="fa-circle-notch" fixedWidth spin />
      </div>
      <div class={errorClass()}>
        <Fa icon={props.error?.icon ?? "fa-times"} fixedWidth />
      </div>
      <div class={barClass()}>
        <div ref={(el) => (fillEl = el)} class="h-full rounded bg-main"></div>
      </div>
      {/* innerHTML because load errors can contain <br> separated messages */}
      {/* oxlint-disable-next-line solid/no-innerhtml */}
      <div class={textClass()} innerHTML={text() ?? ""}></div>
      <Show when={props.error?.detail}>
        {(detail) => <div class="-mt-3 text-sm text-sub">{detail()}</div>}
      </Show>
      <Show when={props.error}>
        {(error) => (
          // large, like the 404 page's button
          <div class="mt-4 flex flex-wrap justify-center gap-4">
            <Button
              fa={{ icon: "fa-redo-alt" }}
              text="Retry"
              class="px-8 py-4"
              onClick={() => error().onRetry()}
            />
            <Show when={error().fallback}>
              {(fallback) => (
                <Button
                  fa={{ icon: "fa-sign-out-alt" }}
                  text={fallback().text}
                  class="px-8 py-4"
                  onClick={() => fallback().run()}
                />
              )}
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}
