import { AnimationParams } from "animejs";
import { JSXElement, Match, ParentProps, useContext } from "solid-js";

import { Anime } from "./Anime";
import { AnimeSwitchContext } from "./AnimeSwitch";

/**
 * A `<Match>` wrapper that integrates with `<AnimeSwitch>` to apply exit/enter
 * animations to conditional content inside a `<Switch>` block.
 *
 * Animation props (`initial`, `animate`, `exit`) fall back to whatever was
 * provided on the parent `<AnimeSwitch>`, but can be overridden per-case.
 *
 * Must be a direct child of `<AnimeSwitch>`.
 *
 * @example
 * ```tsx
 * <AnimeSwitch animeProps={{ exit: { opacity: 0, duration: 200 } }}>
 *   <AnimeMatch when={step() === 1}>
 *     <StepOne />
 *   </AnimeMatch>
 *   <AnimeMatch when={step() === 2} exit={{ opacity: 0, translateY: 10, duration: 200 }}>
 *     <StepTwo />
 *   </AnimeMatch>
 * </AnimeSwitch>
 * ```
 */
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

  // Fall back to context values from AnimeSwitch when not explicitly provided
  const initial = () => props.initial ?? ctx?.()?.initial;
  const animate = () => props.animate ?? ctx?.()?.animate;
  const exit = () => props.exit ?? ctx?.()?.exit;

  // copies built in plain accessors, not JSX ternaries: those compile to a
  // memo per read, and Anime reads these in cleanup where there is no owner
  const animateCopy = (): AnimationParams | undefined => {
    const params = animate();
    return params ? { ...params } : undefined;
  };
  const exitCopy = (): AnimationParams | undefined => {
    const params = exit();
    return params ? { ...params } : undefined;
  };

  return (
    <Match when={props.when}>
      <Anime initial={initial()} animate={animateCopy()} exit={exitCopy()}>
        {props.children}
      </Anime>
    </Match>
  );
}
