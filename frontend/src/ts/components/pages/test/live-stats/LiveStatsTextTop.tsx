import { getConfig } from "../../../../config/store";
import { cn } from "../../../../utils/cn";
import { AnimeShow } from "../../../common/anime";
import {
  TEXT_DISPLAY_CLASS,
  TEXT_WRAPPER_CLASS,
  isTimerStyle,
  liveStatsColorClass,
} from "./styles";
import { getTimerText, isTimerFlashHidden, showLiveStats } from "./util";

export function LiveStatsTextTop() {
  return (
    <div
      class={cn(
        TEXT_DISPLAY_CLASS,
        "w-0 justify-self-center",
        liveStatsColorClass(),
      )}
      style={{
        opacity: getConfig.timerOpacity,
      }}
    >
      <div class={cn(TEXT_WRAPPER_CLASS, "bottom-5")}>
        <AnimeShow when={showLiveStats() && isTimerStyle("text", "flash_text")}>
          {/* flash_text blanks the text instead of fading it, unlike flash_mini */}
          <div>{isTimerFlashHidden() ? "" : getTimerText()}</div>
        </AnimeShow>
      </div>
    </div>
  );
}
