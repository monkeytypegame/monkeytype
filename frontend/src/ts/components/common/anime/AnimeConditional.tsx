import { JSXElement, ParentProps } from "solid-js";

import { Conditional } from "../Conditional";
import { Anime, AnimeProps } from "./Anime";
import { AnimePresence } from "./AnimePresence";

export function AnimeConditional(
  props: ParentProps<
    {
      exitBeforeEnter?: boolean;
      if: boolean;
      then: JSXElement;
      else?: JSXElement;
    } & AnimeProps
  >,
): JSXElement {
  return (
    <AnimePresence exitBeforeEnter={props.exitBeforeEnter}>
      <Conditional
        if={props.if}
        then={
          <Anime
            initial={props.initial}
            animate={props.animate}
            exit={props.exit}
          >
            {props.then}
          </Anime>
        }
        else={
          <Anime
            initial={props.initial}
            animate={props.animate}
            exit={props.exit}
          >
            {props.else}
          </Anime>
        }
      />
    </AnimePresence>
  );
}
