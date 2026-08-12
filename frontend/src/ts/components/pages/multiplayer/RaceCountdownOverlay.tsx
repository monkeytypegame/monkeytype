import { createEffect, createSignal, onCleanup, Show } from "solid-js";

import { getRaceCountdown } from "../../../states/multiplayer";

export function RaceCountdownOverlay() {
  const [secondsLeft, setSecondsLeft] = createSignal<number | null>(null);

  createEffect(() => {
    const countdown = getRaceCountdown();
    if (countdown === null) {
      setSecondsLeft(null);
      return;
    }

    const tick = (): void => {
      const remainingMs = countdown.startsAtServerTime - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
    };
    tick();

    const interval = setInterval(tick, 100);
    onCleanup(() => clearInterval(interval));
  });

  return (
    <Show when={getRaceCountdown() !== null}>
      <div class="pointer-events-none absolute z-999 flex h-full w-full place-content-center items-center gap-2 text-center select-none">
        <div class="text-[4em] font-bold text-main">
          {secondsLeft() === 0 ? "go!" : secondsLeft()}
        </div>
      </div>
    </Show>
  );
}
