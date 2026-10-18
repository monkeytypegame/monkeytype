import { AnimationParams } from "animejs";
import { JSXElement, onMount, ParentProps, Show } from "solid-js";

import { Anime, AnimeProps } from "./Anime";
import { AnimePresence } from "./AnimePresence";

/**
 * A convenient wrapper around AnimePresence + Anime for simple show/hide animations.
 * Animations (initial/animate/exit) are hardcoded — use `<AnimePresence>` + `<Anime>` directly
 * if you need custom animation parameters.
 *
 * @prop when - Controls visibility
 * @prop slide - If true, animates height instead of opacity
 * @prop animateOnMount - If false, content shown on mount appears without
 *   animating; only later toggles animate (default: true)
 * @prop duration - Animation duration in ms (default: 250)
 *
 * @example
 * ```tsx
 * <AnimeShow when={visible()}>
 *   <div>Fades in and out automatically</div>
 * </AnimeShow>
 * ```
 *
 * @example
 * ```tsx
 * <AnimeShow when={visible()} slide duration={400}>
 *   <div>Slides open/closed</div>
 * </AnimeShow>
 * ```
 */
export function AnimeShow(
  props: ParentProps<{
    when: boolean;
    slide?: true;
    animateOnMount?: boolean;
    duration?: number;
    class?: string;
    animeProps?: Partial<AnimeProps>;
    fallback?: JSXElement;
  }>,
): JSXElement {
  const duration = () => props.duration ?? 125;

  // read when the content is created - content created after mount always
  // animates in
  let isMounted = false;
  onMount(() => (isMounted = true));
  const shouldAnimateIn = (): boolean =>
    isMounted || (props.animateOnMount ?? true);

  // the content and the fallback animate the same way. Each call is one
  // element AnimePresence animates out (exitBeforeEnter) before the other
  // animates in
  const fade = (content: JSXElement): JSXElement => {
    const animateIn = shouldAnimateIn();
    return (
      <Anime
        initial={
          animateIn ? ({ opacity: 0 } as Partial<AnimationParams>) : undefined
        }
        animate={
          animateIn
            ? ({ opacity: 1, duration: duration() } as AnimationParams)
            : undefined
        }
        exit={{ opacity: 0, duration: duration() } as AnimationParams}
        {...props.animeProps}
        class={props.class}
      >
        {content}
      </Anime>
    );
  };

  const slide = (content: JSXElement): JSXElement => {
    let ref: HTMLElement | undefined;
    const animateIn = shouldAnimateIn();
    return (
      <Anime
        ref={(el) => (ref = el)}
        initial={
          animateIn ? ({ height: 0 } as Partial<AnimationParams>) : undefined
        }
        animate={
          animateIn
            ? ({
                height: "auto",
                duration: duration(),
                onBegin: () => {
                  if (ref) ref.style.overflow = "hidden";
                },
                onComplete: () => {
                  if (ref) ref.style.overflow = "";
                },
              } as AnimationParams)
            : undefined
        }
        exit={
          {
            height: 0,
            duration: duration(),
            onBegin: () => {
              if (ref) ref.style.overflow = "hidden";
            },
          } as AnimationParams
        }
        {...props.animeProps}
        class={props.class}
      >
        {content}
      </Anime>
    );
  };

  const animated = (content: JSXElement): JSXElement =>
    props.slide ? slide(content) : fade(content);

  return (
    <AnimePresence exitBeforeEnter>
      <Show
        when={props.when}
        fallback={
          props.fallback === undefined ? undefined : animated(props.fallback)
        }
      >
        {animated(props.children)}
      </Show>
    </AnimePresence>
  );
}
