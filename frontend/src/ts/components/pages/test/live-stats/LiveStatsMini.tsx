import { getConfig } from "../../../../config/store";
import { cn } from "../../../../utils/cn";
import { AnimeShow } from "../../../common/anime";
import {
  getLiveAccText,
  getLiveBurstText,
  getLiveSpeedText,
  getTimerText,
  isTimerFlashHidden,
  showLiveStats,
} from "./signals";
import { isTimerStyle, liveStatsColorClass } from "./styles";

export function LiveStatsMini() {
  const isTape = () => getConfig.tapeMode !== "off";

  return (
    <div
      class={cn("mt-[-1.25em] flex h-0 w-0 gap-[0.5em] leading-[1em]", {
        "justify-center": isTape(),
        "justify-start": !isTape(),
        ...liveStatsColorClass(),
      })}
      style={{
        "font-size": `${getConfig.fontSize}rem`,
        opacity: getConfig.timerOpacity,
        "margin-left": isTape() ? `${getConfig.tapeMargin}%` : "0.25em",
      }}
    >
      <AnimeShow when={showLiveStats() && isTimerStyle("mini", "flash_mini")}>
        {/* the fade animates the wrapper opacity, so the flash gate lives on the child */}
        <div style={{ opacity: isTimerFlashHidden() ? 0 : 1 }}>
          {getTimerText()}
        </div>
      </AnimeShow>
      <AnimeShow when={showLiveStats() && getConfig.liveSpeedStyle === "mini"}>
        {getLiveSpeedText()}
      </AnimeShow>
      <AnimeShow when={showLiveStats() && getConfig.liveAccStyle === "mini"}>
        {getLiveAccText()}
      </AnimeShow>
      <AnimeShow when={showLiveStats() && getConfig.liveBurstStyle === "mini"}>
        {getLiveBurstText()}
      </AnimeShow>
    </div>
  );
}
