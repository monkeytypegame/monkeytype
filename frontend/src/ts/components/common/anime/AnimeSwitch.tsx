import {
  Accessor,
  Context,
  createContext,
  createMemo,
  JSXElement,
  ParentProps,
  Switch,
} from "solid-js";

import { AnimeProps } from "./Anime";
import { AnimePresence } from "./AnimePresence";

/**
 * Context that passes shared `AnimeProps` defaults from `<AnimeSwitch>` down to
 * `<AnimeMatch>` children. Children can override individual props, but fall back
 * to the context values when not specified.
 */
export const AnimeSwitchContext: Context<
  Accessor<AnimeProps | undefined> | undefined
> = createContext<Accessor<AnimeProps | undefined> | undefined>(undefined);

/**
 * A convenience wrapper that combines `<Switch>` + `<AnimePresence>` with shared
 * animation defaults for all child `<AnimeMatch>` elements.
 *
 * Pass `animeProps` to define default `initial`/`animate`/`exit` values for every
 * match case. Each `<AnimeMatch>` can still override those values individually.
 *
 * @example
 * ```tsx
 * <AnimeSwitch
 *   exitBeforeEnter
 *   animeProps={{
 *     initial: { opacity: 0, translateX: -20 },
 *     animate: { opacity: 1, translateX: 0, duration: 300 },
 *     exit:    { opacity: 0, translateX:  20, duration: 300 },
 *   }}
 * >
 *   <AnimeMatch when={tab() === "a"}><ViewA /></AnimeMatch>
 *   <AnimeMatch when={tab() === "b"}><ViewB /></AnimeMatch>
 * </AnimeSwitch>
 * ```
 */
export function AnimeSwitch(
  props: ParentProps<{ exitBeforeEnter?: boolean; animeProps?: AnimeProps }>,
): JSXElement {
  const animeProps = createMemo(() => props.animeProps);

  return (
    <AnimeSwitchContext.Provider value={animeProps}>
      <AnimePresence exitBeforeEnter={props.exitBeforeEnter}>
        <Switch>{props.children}</Switch>
      </AnimePresence>
    </AnimeSwitchContext.Provider>
  );
}
