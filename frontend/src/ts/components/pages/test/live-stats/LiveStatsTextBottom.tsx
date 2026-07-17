import { getConfig } from "../../../../config/store";
import { cn } from "../../../../utils/cn";
import { AnimeShow } from "../../../common/anime";
import {
  TEXT_DISPLAY_CLASS,
  TEXT_WRAPPER_CLASS,
  liveStatsColorClass,
} from "./styles";
import {
  getLiveAccText,
  getLiveBurstText,
  getLiveSpeedText,
  showLiveStats,
} from "./util";

export function LiveStatsTextBottom() {
  return (
    <div
      class={cn(TEXT_DISPLAY_CLASS, "mx-auto w-full", liveStatsColorClass())}
      style={{
        opacity: getConfig.timerOpacity,
      }}
    >
      <div class={cn(TEXT_WRAPPER_CLASS, "top-4")}>
        <AnimeShow
          when={showLiveStats() && getConfig.liveSpeedStyle === "text"}
        >
          {getLiveSpeedText()}
        </AnimeShow>
        <AnimeShow when={showLiveStats() && getConfig.liveAccStyle === "text"}>
          {getLiveAccText()}
        </AnimeShow>
        <AnimeShow
          when={showLiveStats() && getConfig.liveBurstStyle === "text"}
        >
          {getLiveBurstText()}
        </AnimeShow>
      </div>
    </div>
  );
}
