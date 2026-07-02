import { mapRange } from "@monkeytype/util/numbers";
import { Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getMonkeyState } from "../../../states/monkey";
import { currentLiveStats, isTestActive } from "../../../states/test";

const MIN_WPM = 130;
const MAX_WPM = 180;

export function Monkey() {
  const speed = () =>
    (getConfig.blindMode ? currentLiveStats.raw : currentLiveStats.wpm) ?? 0;

  const fastOpacity = () => mapRange(speed(), MIN_WPM, MAX_WPM, 0, 1);

  const animDuration = () => {
    const duration = mapRange(speed(), MIN_WPM, MAX_WPM, 0.25, 0.01);
    return duration === 0.25 ? 0 : duration;
  };

  const state = () => {
    const { left, right } = getMonkeyState();
    if (left && !right) return "left" as const;
    if (right && !left) return "right" as const;
    if (!left && !right) return "none" as const;
    return "both" as const;
  };

  const monkeyImages = (suffix?: string) => {
    const cur = state();
    return [
      <img
        src={`/images/monkey/m1${suffix ?? ""}.png`}
        class={cur === "left" ? "visible" : "hidden"}
      />,
      <img
        src={`/images/monkey/m2${suffix ?? ""}.png`}
        class={cur === "right" ? "visible" : "hidden"}
      />,
      <img
        src={`/images/monkey/m3${suffix ?? ""}.png`}
        class={cur === "none" ? "visible" : "hidden"}
      />,
      <img
        src={`/images/monkey/m4${suffix ?? ""}.png`}
        class={cur === "both" ? "visible" : "hidden"}
      />,
    ];
  };

  return (
    <Show when={getConfig.monkey && isTestActive()}>
      <div
        class="animate-shake flex w-full justify-center"
        style={{ "animation-duration": `${animDuration()}s` }}
      >
        {monkeyImages()}
        <div
          class="fixed transition-all duration-1000"
          style={{ opacity: fastOpacity() }}
        >
          {monkeyImages("_fast")}
        </div>
      </div>
    </Show>
  );
}
