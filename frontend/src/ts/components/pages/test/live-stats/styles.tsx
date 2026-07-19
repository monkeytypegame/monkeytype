import { getConfig } from "../../../../config/store";
import { cn } from "../../../../utils/cn";

export const liveStatsTextColor = (): Record<string, boolean> => ({
  "text-main": getConfig.timerColor === "main",
  "text-sub": getConfig.timerColor === "sub",
  "text-text": getConfig.timerColor === "text",
  "text-[#000000]": getConfig.timerColor === "black",
});

export const liveStatsBgColor = (): Record<string, boolean> => ({
  "bg-main": getConfig.timerColor === "main",
  "bg-sub": getConfig.timerColor === "sub",
  "bg-text": getConfig.timerColor === "text",
  "bg-[#000000]": getConfig.timerColor === "black",
});

export const TEXT_DISPLAY_CLASS = cn(
  "text-[4rem] sm:text-[6rem] md:text-[7rem] lg:text-[8rem] xl:text-[10rem]",
  "pointer-events-none relative z-[-1] grid h-0 text-center",
);

export const TEXT_WRAPPER_CLASS =
  "absolute flex justify-self-center gap-[0.5ch] leading-none";
