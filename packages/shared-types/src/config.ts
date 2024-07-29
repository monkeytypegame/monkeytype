import { PersonalBests } from "@monkeytype/contracts/schemas/users";

export type SmoothCaret =
  import("@monkeytype/contracts/schemas/configs").SmoothCaret;
export type QuickRestart =
  import("@monkeytype/contracts/schemas/configs").QuickRestart;
export type QuoteLength =
  import("@monkeytype/contracts/schemas/configs").QuoteLength;
export type CaretStyle =
  import("@monkeytype/contracts/schemas/configs").CaretStyle;
export type Difficulty =
  import("@monkeytype/contracts/schemas/configs").Difficulty;
export type Mode = import("@monkeytype/contracts/schemas/configs").Mode;
export type Mode2<M extends Mode> = M extends M
  ? keyof PersonalBests[M]
  : never;
export type Mode2Custom<M extends Mode> = Mode2<M> | "custom";
export type ConfidenceMode =
  import("@monkeytype/contracts/schemas/configs").ConfidenceMode;
export type IndicateTypos =
  import("@monkeytype/contracts/schemas/configs").IndicateTypos;
export type TimerStyle =
  import("@monkeytype/contracts/schemas/configs").TimerStyle;
export type LiveSpeedAccBurstStyle =
  import("@monkeytype/contracts/schemas/configs").LiveSpeedAccBurstStyle;
export type RandomTheme =
  import("@monkeytype/contracts/schemas/configs").RandomTheme;
export type TimerColor =
  import("@monkeytype/contracts/schemas/configs").TimerColor;
export type TimerOpacity =
  import("@monkeytype/contracts/schemas/configs").TimerOpacity;
export type StopOnError =
  import("@monkeytype/contracts/schemas/configs").StopOnError;
export type KeymapMode =
  import("@monkeytype/contracts/schemas/configs").KeymapMode;
export type KeymapStyle =
  import("@monkeytype/contracts/schemas/configs").KeymapStyle;
export type KeymapLegendStyle =
  import("@monkeytype/contracts/schemas/configs").KeymapLegendStyle;
export type KeymapShowTopRow =
  import("@monkeytype/contracts/schemas/configs").KeymapShowTopRow;
export type SingleListCommandLine =
  import("@monkeytype/contracts/schemas/configs").SingleListCommandLine;
export type PlaySoundOnClick =
  import("@monkeytype/contracts/schemas/configs").PlaySoundOnClick;
export type PlaySoundOnError =
  import("@monkeytype/contracts/schemas/configs").PlaySoundOnError;
export type SoundVolume =
  import("@monkeytype/contracts/schemas/configs").SoundVolume;
export type PaceCaret =
  import("@monkeytype/contracts/schemas/configs").PaceCaret;
export type AccountChart =
  import("@monkeytype/contracts/schemas/configs").AccountChart;
export type MinimumWordsPerMinute =
  import("@monkeytype/contracts/schemas/configs").MinimumWordsPerMinute;
export type HighlightMode =
  import("@monkeytype/contracts/schemas/configs").HighlightMode;
export type TypingSpeedUnit =
  import("@monkeytype/contracts/schemas/configs").TypingSpeedUnit;
export type Ads = import("@monkeytype/contracts/schemas/configs").Ads;
export type MinimumAccuracy =
  import("@monkeytype/contracts/schemas/configs").MinimumAccuracy;
export type RepeatQuotes =
  import("@monkeytype/contracts/schemas/configs").RepeatQuotes;
export type OppositeShiftMode =
  import("@monkeytype/contracts/schemas/configs").OppositeShiftMode;
export type CustomBackgroundSize =
  import("@monkeytype/contracts/schemas/configs").CustomBackgroundSize;
export type CustomBackgroundFilter =
  import("@monkeytype/contracts/schemas/configs").CustomBackgroundFilter;
export type CustomLayoutFluid =
  import("@monkeytype/contracts/schemas/configs").CustomLayoutFluid;
export type MonkeyPowerLevel =
  import("@monkeytype/contracts/schemas/configs").MonkeyPowerLevel;
export type MinimumBurst =
  import("@monkeytype/contracts/schemas/configs").MinimumBurst;
export type ShowAverage =
  import("@monkeytype/contracts/schemas/configs").ShowAverage;
export type TapeMode = import("@monkeytype/contracts/schemas/configs").TapeMode;
export type CustomThemeColors =
  import("@monkeytype/contracts/schemas/configs").CustomThemeColors;
export type TribeDelta = "off" | "text" | "bar";
export type TribeCarets = "off" | "noNames" | "on";

export type Config = import("@monkeytype/contracts/schemas/configs").Config;
export type ConfigValue = Config[keyof Config];
