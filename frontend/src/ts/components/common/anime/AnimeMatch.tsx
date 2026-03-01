import { AnimationParams } from "animejs";
import { JSXElement, Match, ParentProps } from "solid-js";

import { Anime } from "./Anime";

export function AnimeMatch(
  props: ParentProps<{
    when: boolean;
    initial: Partial<AnimationParams>;
    animate: AnimationParams;
    exit: AnimationParams;
    duration?: number;
  }>,
): JSXElement {
  return (
    <Match when={props.when}>
      <Anime
        initial={props.initial}
        animate={{ ...props.animate }}
        exit={{ ...props.exit }}
      >
        {props.children}
      </Anime>
    </Match>
  );
}
