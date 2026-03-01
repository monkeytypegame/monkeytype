import { JSXElement, ParentProps } from "solid-js";

import { Conditional } from "../Conditional";
import { Anime, AnimeProps } from "./Anime";
import { AnimePresence } from "./AnimePresence";

export function AnimeConditional(
  props: ParentProps<{
    exitBeforeEnter?: boolean;
    if: boolean;
    then: JSXElement;
    else?: JSXElement;
    animeProps?: AnimeProps;
  }>,
): JSXElement {
  const defaultAnimeProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1, duration: 125 },
    exit: { opacity: 0, duration: 125 },
  };

  return (
    <AnimePresence exitBeforeEnter={props.exitBeforeEnter}>
      <Conditional
        if={props.if}
        then={
          <Anime
            initial={props.animeProps?.initial ?? defaultAnimeProps.initial}
            animate={props.animeProps?.animate ?? defaultAnimeProps.animate}
            animation={props.animeProps?.animation}
            exit={props.animeProps?.exit ?? defaultAnimeProps.exit}
          >
            {props.then}
          </Anime>
        }
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
