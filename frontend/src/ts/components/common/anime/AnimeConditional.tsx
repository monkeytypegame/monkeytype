import { Accessor, JSXElement, ParentProps } from "solid-js";

import { Conditional } from "../Conditional";
import { Anime, AnimeProps } from "./Anime";
import { AnimePresence } from "./AnimePresence";

/**
 * A convenience wrapper that renders animated `if/then/else` conditionals.
 *
 * Combines `<AnimePresence>` + `<Conditional>` + `<Anime>` into a single
 * component. Both branches are wrapped in `<Anime>` so they fade in/out
 * automatically. Use `animeProps` to customise the animation; the fallback
 * is a quick 125 ms opacity fade.
 *
 * @example
 * ```tsx
 * <AnimeConditional
 *   if={isAuthenticated()}
 *   then={<Dashboard />}
 *   else={<LoginForm />}
 *   exitBeforeEnter
 * />
 * ```
 *
 * @example
 * Custom animation:
 * ```tsx
 * <AnimeConditional
 *   if={open()}
 *   then={<Panel />}
 *   animeProps={{
 *     initial: { opacity: 0, translateY: -8 },
 *     animate: { opacity: 1, translateY: 0, duration: 200 },
 *     exit:    { opacity: 0, translateY: -8, duration: 150 },
 *   }}
 * />
 * ```
 */
export function AnimeConditional<T>(
  props: ParentProps<{
    exitBeforeEnter?: boolean;
    if: T;
    then: JSXElement | ((value: Accessor<NonNullable<T>>) => JSXElement);
    else?: JSXElement;
    animeProps?: AnimeProps;
  }>,
): JSXElement {
  /** Fallback animation used when no `animeProps` are provided. */
  const defaultAnimeProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1, duration: 125 },
    exit: { opacity: 0, duration: 125 },
  };

  return (
    <AnimePresence exitBeforeEnter={props.exitBeforeEnter}>
      <Conditional
        if={props.if}
        then={(value) => (
          <Anime
            initial={props.animeProps?.initial ?? defaultAnimeProps.initial}
            animate={props.animeProps?.animate ?? defaultAnimeProps.animate}
            animation={props.animeProps?.animation}
            exit={props.animeProps?.exit ?? defaultAnimeProps.exit}
          >
            {typeof props.then === "function" ? props.then(value) : props.then}
          </Anime>
        )}
        else={
          <Anime
            initial={props.animeProps?.initial ?? defaultAnimeProps.initial}
            animate={props.animeProps?.animate ?? defaultAnimeProps.animate}
            animation={props.animeProps?.animation}
            exit={props.animeProps?.exit ?? defaultAnimeProps.exit}
          >
            {props.else}
          </Anime>
        }
      />
    </AnimePresence>
  );
}
