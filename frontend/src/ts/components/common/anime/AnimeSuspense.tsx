import { AnimationParams } from "animejs";
import { JSXElement, onMount, ParentProps, Suspense } from "solid-js";

import { Anime, AnimeProps } from "./Anime";
import { AnimePresence } from "./AnimePresence";

/**
 * A `<Suspense>` that fades between the fallback and the content: the
 * fallback fades out completely before the content fades in.
 *
 * @prop fallback - Shown while the content suspends
 * @prop animateOnMount - If false, content (or a fallback) shown on mount
 *   appears without animating. Content that suspended first always fades in
 *   (default: true)
 * @prop duration - Fade duration in ms (default: 125)
 *
 * @example
 * ```tsx
 * <AnimeSuspense fallback={<LoadingCircle />}>
 *   <Results data={results()} />
 * </AnimeSuspense>
 * ```
 */
export function AnimeSuspense(
  props: ParentProps<{
    fallback?: JSXElement;
    animateOnMount?: boolean;
    duration?: number;
    class?: string;
    animeProps?: Partial<AnimeProps>;
  }>,
): JSXElement {
  const duration = (): number => props.duration ?? 125;

  let isMounted = false;
  let hasSuspended = false;
  onMount(() => (isMounted = true));
  const animateOnMount = (): boolean =>
    isMounted || (props.animateOnMount ?? true);

  // `animateIn` is read when the enter animation starts
  const fade = (content: JSXElement, animateIn: () => boolean): JSXElement => (
    <Anime
      initial={
        animateIn() ? ({ opacity: 0 } as Partial<AnimationParams>) : undefined
      }
      animate={
        animateIn()
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

  return (
    <AnimePresence exitBeforeEnter>
      <Suspense
        fallback={(() => {
          // read before suspending: the fallback shown on mount follows
          // animateOnMount
          const animateIn = animateOnMount();
          hasSuspended = true;
          return props.fallback === undefined
            ? undefined
            : fade(props.fallback, () => animateIn);
        })()}
      >
        {(() => {
          // read when the content is created. hasSuspended is read when the
          // enter animation starts: Suspense holds the effects of content
          // that suspends until it resolved, so it always fades in
          const animateIn = animateOnMount();
          return fade(props.children, () => hasSuspended || animateIn);
        })()}
      </Suspense>
    </AnimePresence>
  );
}
