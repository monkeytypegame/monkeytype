import { JSXElement, ParentProps, Show } from "solid-js";

import { Anime } from "./Anime";
import { AnimePresence } from "./AnimePresence";

/**
 * A convenient wrapper around AnimePresence + Anime for simple show/hide animations.
 * Automatically wraps children in an `<Anime>` element with configurable enter/exit animations.
 *
 * @example
 * ```tsx
 * <AnimatedShow when={visible()}>
 *   <div>Fades in and out automatically</div>
 * </AnimatedShow>
 * ```
 *
 * @example
 * Custom animations:
 * ```tsx
 * <AnimatedShow
 *   when={visible()}
 *   initial={{ opacity: 0, translateY: -10 }}
 *   animate={{ opacity: 1, translateY: 0, duration: 400 }}
 *   exit={{ opacity: 0, translateY: -10, duration: 300 }}
 * >
 *   <div>Slides in and out</div>
 * </AnimatedShow>
 * ```
 */
export function AnimatedShow(
  props: ParentProps<{
    when: boolean;
    fallback?: JSXElement;
  }>,
): JSXElement {
  return (
    <AnimePresence exitBeforeEnter>
      <Show when={props.when} fallback={props.fallback}>
        <Anime
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, duration: 125 }}
          exit={{ opacity: 0, duration: 125 }}
        >
          {props.children}
        </Anime>
      </Show>
    </AnimePresence>
  );
}
