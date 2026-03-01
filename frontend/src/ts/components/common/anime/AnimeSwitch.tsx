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

export const AnimeSwitchContext: Context<
  Accessor<AnimeProps | undefined> | undefined
> = createContext<Accessor<AnimeProps | undefined> | undefined>(undefined);

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
