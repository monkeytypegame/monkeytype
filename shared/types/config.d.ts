declare namespace SharedTypes.Config {
  type SmoothCaret = import("../schemas/config").SmoothCaret;
  type QuickRestart = import("../schemas/config").QuickRestart;
  type QuoteLength = import("../schemas/config").QuoteLength;
  type CaretStyle = import("../schemas/config").CaretStyle;
  type Difficulty = import("../schemas/types").Difficulty;
  type Mode = import("../schemas/types").Mode;
  type Mode2<M extends Mode> = M extends M ? keyof PersonalBests[M] : never;
  type Mode2Custom<M extends Mode> = Mode2<M> | "custom";
  type ConfidenceMode = import("../schemas/config").ConfidenceMode;
  type IndicateTypos = import("../schemas/config").IndicateTypos;
  type TimerStyle = import("../schemas/config").TimerStyle;
  type LiveSpeedAccBurstStyle =
    import("../schemas/config").LiveSpeedAccBurstStyle;
  type RandomTheme = import("../schemas/config").RandomTheme;
  type TimerColor = import("../schemas/config").TimerColor;
  type TimerOpacity = import("../schemas/config").TimerOpacity;
  type StopOnError = import("../schemas/config").StopOnError;
  type KeymapMode = import("../schemas/config").KeymapMode;
  type KeymapStyle = import("../schemas/config").KeymapStyle;
  type KeymapLegendStyle = import("../schemas/config").KeymapLegendStyle;
  type KeymapShowTopRow = import("../schemas/config").KeymapShowTopRow;
  type SingleListCommandLine =
    import("../schemas/config").SingleListCommandLine;
  type PlaySoundOnClick = import("../schemas/config").PlaySoundOnClick;
  type PlaySoundOnError = import("../schemas/config").PlaySoundOnError;
  type SoundVolume = import("../schemas/config").SoundVolume;
  type PaceCaret = import("../schemas/config").PaceCaret;
  type AccountChart = import("../schemas/config").AccountChart;
  type MinimumWordsPerMinute =
    import("../schemas/config").MinimumWordsPerMinute;
  type HighlightMode = import("../schemas/config").HighlightMode;
  type TypingSpeedUnit = import("../schemas/config").TypingSpeedUnit;
  type Ads = import("../schemas/config").Ads;
  type MinimumAccuracy = import("../schemas/config").MinimumAccuracy;
  type RepeatQuotes = import("../schemas/config").RepeatQuotes;
  type OppositeShiftMode = import("../schemas/config").OppositeShiftMode;
  type CustomBackgroundSize = import("../schemas/config").CustomBackgroundSize;
  type CustomBackgroundFilter =
    import("../schemas/config").CustomBackgroundFilter;
  type CustomLayoutFluid = import("../schemas/config").CustomLayoutFluid;
  type MonkeyPowerLevel = import("../schemas/config").MonkeyPowerLevel;
  type MinimumBurst = import("../schemas/config").MinimumBurst;
  type ShowAverage = import("../schemas/config").ShowAverage;
  type TapeMode = import("../schemas/config").TapeMode;
  type CustomThemeColors = import("../schemas/config").CustomThemeColors;
}
