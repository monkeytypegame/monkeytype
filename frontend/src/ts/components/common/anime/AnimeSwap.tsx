import {
  createComputed,
  createSignal,
  JSXElement,
  on,
  Show,
  untrack,
} from "solid-js";

import { AnimePresence } from "./AnimePresence";

/**
 * One child per `key`, rendered by `children` (an `<Anime>` with an `exit`),
 * switching with the old child's exit before the new one's enter. Unlike
 * `<AnimePresence exitBeforeEnter>` around a keyed `<Show>`, which builds the
 * new child at once and holds it detached until the old one exited, the new
 * child is built only once the old one is out of the DOM: it mounts in the
 * document, so it can measure and focus on mount. A key changing several
 * times during an exit builds only the last one; one changing back builds a
 * new child for it once the old one exited. A child without an exit is
 * replaced at once.
 */
export type AnimeSwapProps<K extends string> = {
  key: K;
  children: (key: K) => JSXElement;
};

export function AnimeSwap<K extends string>(
  props: AnimeSwapProps<K>,
): JSXElement {
  // trails props.key: undefined while the old child exits. State, not a memo:
  // the exit ending sets it too. A computed, not an effect: cleared before
  // the Show renders, so the new child is never built
  const [shownKey, setShownKey] = createSignal<K | undefined>(
    untrack(() => props.key),
  );
  createComputed(
    on(
      () => props.key,
      (key) => {
        const shown = shownKey();
        if (shown !== undefined && shown !== key) setShownKey(undefined);
      },
      { defer: true },
    ),
  );

  return (
    <AnimePresence
      exitBeforeEnter
      onExitComplete={() => {
        if (shownKey() === undefined) setShownKey(() => props.key);
      }}
    >
      <Show when={shownKey()} keyed>
        {props.children}
      </Show>
    </AnimePresence>
  );
}
