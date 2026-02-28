import { AnimationParams } from "animejs";
import { JSXElement, ParentProps, Show } from "solid-js";

import { Anime } from "./Anime";
import { AnimePresence } from "./AnimePresence";

/**
 * A convenient wrapper around AnimePresence + Anime for simple show/hide animations.
 * Animations (initial/animate/exit) are hardcoded — use `<AnimePresence>` + `<Anime>` directly
 * if you need custom animation parameters.
 *
 * @prop when - Controls visibility
 * @prop slide - If true, animates height instead of opacity
 * @prop duration - Animation duration in ms (default: 250)
 *
 * @example
 * ```tsx
 * <AnimatedShow when={visible()}>
 *   <div>Fades in and out automatically</div>
 * </AnimatedShow>
 * ```
 *
 * @example
 * ```tsx
 * <AnimatedShow when={visible()} slide duration={400}>
 *   <div>Slides open/closed</div>
 * </AnimatedShow>
 * ```
 */
export function AnimatedShow(
  props: ParentProps<{
    when: boolean;
    slide?: true;
    duration?: number;
  }>,
): JSXElement {
  const duration = () => props.duration ?? 250;

  return (
    <Show
      when={props.slide}
      fallback={
        <AnimePresence exitBeforeEnter>
          <Show when={props.when}>
            <Anime
              initial={{ opacity: 0 } as Partial<AnimationParams>}
              animate={{ opacity: 1, duration: duration() } as AnimationParams}
              exit={{ opacity: 0, duration: duration() } as AnimationParams}
            >
              {props.children}
            </Anime>
          </Show>
        </AnimePresence>
      }
    >
      <AnimePresence exitBeforeEnter>
        <Show when={props.when}>
          <Anime
            initial={{ height: 0 } as Partial<AnimationParams>}
            animate={
              { height: "auto", duration: duration() } as AnimationParams
            }
            exit={{ height: 0, duration: duration() } as AnimationParams}
            style={{ overflow: "hidden" }}
          >
            {props.children}
          </Anime>
        </Show>
      </AnimePresence>
    </Show>
  );
}
