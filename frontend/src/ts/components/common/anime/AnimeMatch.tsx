import { AnimationParams } from "animejs";
import { JSXElement, Match, ParentProps, useContext } from "solid-js";

import { Anime } from "./Anime";
import { AnimeSwitchContext } from "./AnimeSwitch";

export function AnimeMatch(
  props: ParentProps<{
    when: boolean;
    initial?: Partial<AnimationParams>;
    animate?: AnimationParams;
    exit?: AnimationParams;
    duration?: number;
  }>,
): JSXElement {
  const ctx = useContext(AnimeSwitchContext);

  const initial = () => props.initial ?? ctx?.()?.initial;
  const animate = () => props.animate ?? ctx?.()?.animate;
  const exit = () => props.exit ?? ctx?.()?.exit;

  return (
    <Match when={props.when}>
      <Anime
        initial={initial()}
        animate={animate() ? { ...animate() } : undefined}
        exit={exit() ? { ...exit() } : undefined}
      >
        {props.children}
      </Anime>
    </Match>
  );
}
