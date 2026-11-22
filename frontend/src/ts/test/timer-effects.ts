import { createEffect, createRoot, on } from "solid-js";
import { KeymapLayout, Layout } from "@monkeytype/schemas/configs";
import { clearLowFpsMode, setLowFpsMode } from "../anim";
import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import { playTimeWarning } from "../audio";
import {
  highlightKeymapKey,
  setLayoutfluidTimerText,
  setLayoutfluidTimerVisible,
} from "../states/test";
import { capitalizeFirstLetter } from "../utils/strings";
import * as CustomText from "./custom-text";
import { getCurrentInput } from "./engine/events/data";
import { getTimerTick, isSlowTimer, isTimerRunning } from "./engine/test-timer";
import * as TestWords from "./engine/test-words";

// The timer's side effects outside the engine, as effects on its signals.
// The tick signal is written once per tick, catch-up ticks included, and the
// effects run synchronously on that write, so they fire on the correct
// seconds, before the timer checks the time limit.

function getMaxTime(): number | undefined {
  if (Config.mode === "time") return Config.time;
  if (Config.mode === "custom" && CustomText.getLimitMode() === "time") {
    return CustomText.getLimitValue();
  }
  return undefined;
}

function timeWarning(testTime: number): void {
  if (Config.playTimeWarning === "off") return;
  const maxTime = getMaxTime();
  if (
    maxTime !== undefined &&
    testTime === maxTime - parseInt(Config.playTimeWarning, 10)
  ) {
    void playTimeWarning();
  }
}

// layoutfluid funbox: T6b+ turns it into an engine plugin timing hook
function layoutfluid(time: number): void {
  if (!Config.funbox.includes("layoutfluid") || Config.mode !== "time") return;

  const layouts = Config.customLayoutfluid;
  const switchTime = Config.time / layouts.length;
  const index = Math.floor(time / switchTime);
  const layout = layouts[index];
  const flooredSwitchTimes: number[] = [];

  for (let i = 1; i < layouts.length; i++) {
    flooredSwitchTimes.push(Math.floor(switchTime * i));
  }

  const secondsUntilSwitch = [3, 2, 1].find((sec) =>
    flooredSwitchTimes.includes(time + sec),
  );
  if (secondsUntilSwitch !== undefined) {
    const nextLayout = capitalizeFirstLetter(layouts[index + 1] as string);
    setLayoutfluidTimerText(`${nextLayout} in: ${secondsUntilSwitch}s`);
    setLayoutfluidTimerVisible(true);
  }

  if (Config.layout !== layout && layout !== undefined) {
    setLayoutfluidTimerVisible(false);
    setConfig("layout", layout as Layout, {
      nosave: true,
    });
    setConfig("keymapLayout", layout as KeymapLayout, {
      nosave: true,
    });

    if (Config.keymapMode === "next") {
      setTimeout(() => {
        highlightKeymapKey(
          TestWords.words.getCurrent()?.text.charAt(getCurrentInput().length) ??
            "",
        );
      }, 1);
    }
  }
}

createRoot(() => {
  createEffect(
    on(
      getTimerTick,
      (tick) => {
        // 0: the timer (re)started, no tick yet
        if (tick === 0) return;
        timeWarning(tick);
        layoutfluid(tick);
      },
      { defer: true },
    ),
  );

  // slow timer: animations off while the timer runs
  createEffect(
    on(
      () => [isTimerRunning(), isSlowTimer()] as const,
      ([running, slow]) => {
        if (!running) clearLowFpsMode();
        else if (slow) setLowFpsMode();
      },
      { defer: true },
    ),
  );
});
