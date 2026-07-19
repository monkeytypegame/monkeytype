import { animate } from "animejs";
import { createEffect } from "solid-js";

import { getConfig } from "../../../../config/store";
import {
  currentLiveStats,
  getBailedOut,
  isResultCalculating,
} from "../../../../states/test";
import { cn } from "../../../../utils/cn";
import { Anime } from "../../../common/anime";
import { liveStatsBarColorClass } from "./styles";
import {
  getCurrentWordCount,
  getTestTimeLimit,
  getWordsTotal,
  isTimeLimitedTest,
  showLiveStats,
} from "./util";

export function BarTimerProgress() {
  let barEl: HTMLElement | undefined;

  // Undefined progress means the test was reset, so the bar snaps back to its
  // starting width instead of animating there.
  const barTarget = (): { width: string; duration: number; ease?: string } => {
    if (isTimeLimitedTest()) {
      const { seconds } = currentLiveStats;
      if (seconds === undefined) return { width: "100vw", duration: 0 };
      return {
        width: `${100 - ((seconds + 1) / getTestTimeLimit()) * 100}vw`,
        duration: 1000,
        ease: "linear",
      };
    }
    const wordsTotal = getWordsTotal();
    // no elapsed time means the test was reset, so snap back instead of animating
    if (currentLiveStats.seconds === undefined || wordsTotal === 0) {
      return { width: "0vw", duration: 0 };
    }
    // the active word index stops on the last word instead of going one past it,
    // so the word count alone tops out at (n-1)/n — fill the bar on finish.
    // isResultCalculating flips on the first line of finish(); getResultVisible
    // would be a fade-out too late, since the bar outlives the words fading out.
    if (isResultCalculating() && !getBailedOut()) {
      return { width: "100vw", duration: 125 };
    }
    return {
      width: `${Math.floor((getCurrentWordCount() / wordsTotal) * 100)}vw`,
      duration: 250,
    };
  };

  createEffect(() => {
    const target = barTarget();
    if (barEl === undefined) return;
    animate(barEl, target);
  });

  const shown = () =>
    showLiveStats() &&
    getConfig.mode !== "zen" &&
    getConfig.timerStyle === "bar";

  return (
    <div class="relative z-99" style={{ opacity: getConfig.timerOpacity }}>
      <Anime
        initial={{ opacity: 0 }}
        animation={{ opacity: shown() ? 1 : 0, duration: 125 }}
      >
        <div
          ref={(el) => (barEl = el)}
          class={cn(
            "fixed top-0 left-0 z-[-1] h-2 w-screen",
            liveStatsBarColorClass(),
          )}
        ></div>
      </Anime>
    </div>
  );
}
