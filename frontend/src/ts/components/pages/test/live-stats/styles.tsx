import { getConfig } from "../../../../config/store";
import { cn } from "../../../../utils/cn";

// Shared styling for the live stat displays (mini, text and bar), which all
// follow the timerColor / timerOpacity config.

/** main/sub/text are tailwind color tokens; black has none, see {@link liveStatsBlackColor}. */
export const liveStatsColorClass = (): Record<string, boolean> => ({
  "text-main": getConfig.timerColor === "main",
  "text-sub": getConfig.timerColor === "sub",
  "text-text": getConfig.timerColor === "text",
  "text-[#000000]": getConfig.timerColor === "black",
});

/** The bar colors its background rather than its text. */
export const liveStatsBarColorClass = (): Record<string, boolean> => ({
  "bg-main": getConfig.timerColor === "main",
  "bg-sub": getConfig.timerColor === "sub",
  "bg-text": getConfig.timerColor === "text",
  "bg-[#000000]": getConfig.timerColor === "black",
});

/** True when the timer displays should be on screen for the given styles. */
export const isTimerStyle = (...styles: string[]): boolean =>
  styles.includes(getConfig.timerStyle);

// `liveStatsText` owns the font size (see styles/test.scss). It has to stay in
// scss: the size is overridden per breakpoint in styles/media-queries-*.scss,
// and those live in the custom-styles cascade layer, which any unlayered
// tailwind text-* utility here would beat regardless of specificity.
export const TEXT_DISPLAY_CLASS = cn(
  "text-[4rem] sm:text-[6rem] md:text-[7rem] lg:text-[8rem] xl:text-[10rem]",
  "pointer-events-none relative z-[-1] grid h-0 text-center",
);

export const TEXT_WRAPPER_CLASS =
  "absolute flex justify-self-center gap-[0.5ch] leading-none";
