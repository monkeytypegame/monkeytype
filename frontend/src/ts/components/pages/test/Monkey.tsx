import { mapRange } from "@monkeytype/util/numbers";
import { Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getMonkeyState } from "../../../states/monkey";
import { currentLiveStats, isTestActive } from "../../../states/test";

//TODO revert to 130, 180
const MIN_WPM = 30;
const MAX_WPM = 80;

export function Monkey() {
  const speed = () =>
    (getConfig.blindMode ? currentLiveStats.raw : currentLiveStats.wpm) ?? 0;

  const fastOpacity = () => mapRange(speed(), MIN_WPM, MAX_WPM, 0, 1);

  const animDuration = () => {
    const duration = mapRange(speed(), MIN_WPM, MAX_WPM, 0.25, 0.01);
    return duration === 0.25 ? 0 : duration;
  };

  return (
    <Show when={getConfig.monkey && isTestActive()}>
      <div
        class="animate-shake flex w-full justify-center"
        style={{ "animation-duration": `${animDuration()}s` }}
      >
        <img
          src="/images/monkey/m1.png"
          class={
            getMonkeyState().left && !getMonkeyState().right
              ? "visible"
              : "hidden"
          }
        />
        <img
          src="/images/monkey/m2.png"
          class={
            getMonkeyState().right && !getMonkeyState().left
              ? "visible"
              : "hidden"
          }
        />
        <img
          src="/images/monkey/m3.png"
          class={
            !getMonkeyState().left && !getMonkeyState().right
              ? "visible"
              : "hidden"
          }
        />
        <img
          src="/images/monkey/m4.png"
          class={
            getMonkeyState().left && getMonkeyState().right
              ? "visible"
              : "hidden"
          }
        />

        <div
          class="fixed transition-all duration-1000"
          style={{ opacity: fastOpacity() }}
        >
          <img
            src="/images/monkey/m1_fast.png"
            class={
              getMonkeyState().left && !getMonkeyState().right
                ? "visible"
                : "hidden"
            }
          />
          <img
            src="/images/monkey/m2_fast.png"
            class={
              getMonkeyState().right && !getMonkeyState().left
                ? "visible"
                : "hidden"
            }
          />
          <img
            src="/images/monkey/m3_fast.png"
            class={
              !getMonkeyState().left && !getMonkeyState().right
                ? "visible"
                : "hidden"
            }
          />
          <img
            src="/images/monkey/m4_fast.png"
            class={
              getMonkeyState().left && getMonkeyState().right
                ? "visible"
                : "hidden"
            }
          />
        </div>
      </div>
    </Show>
  );
}
