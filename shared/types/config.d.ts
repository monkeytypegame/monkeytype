declare namespace SharedTypes.Config {
  type SmoothCaret = import("../contract/shared/config").SmoothCaret;
  type QuickRestart = import("../contract/shared/config").QuickRestart;
  type QuoteLength = import("../contract/shared/config").QuoteLength;
  type CaretStyle = import("../contract/shared/config").CaretStyle;
  type Difficulty = import("../contract/shared/config").Difficulty;
  type Mode = import("../contract/users.contract").Mode;
  type Mode2<M extends Mode> = M extends M ? keyof PersonalBests[M] : never;
  type Mode2Custom<M extends Mode> = Mode2<M> | "custom";
  type ConfidenceMode = import("../contract/shared/config").ConfidenceMode;
  type IndicateTypos = import("../contract/shared/config").IndicateTypos;
  type TimerStyle = import("../contract/shared/config").TimerStyle;
  type LiveSpeedAccBurstStyle =
    import("../contract/shared/config").LiveSpeedAccBurstStyle;
  type RandomTheme = import("../contract/shared/config").RandomTheme;
  type TimerColor = import("../contract/shared/config").TimerColor;
  type TimerOpacity = import("../contract/shared/config").TimerOpacity;
  type StopOnError = import("../contract/shared/config").StopOnError;
  type KeymapMode = import("../contract/shared/config").KeymapMode;
  type KeymapStyle = import("../contract/shared/config").KeymapStyle;
  type KeymapLegendStyle =
    import("../contract/shared/config").KeymapLegendStyle;
  type KeymapShowTopRow = import("../contract/shared/config").KeymapShowTopRow;
  type SingleListCommandLine =
    import("../contract/shared/config").SingleListCommandLine;
  type PlaySoundOnClick = import("../contract/shared/config").PlaySoundOnClick;
  type PlaySoundOnError = import("../contract/shared/config").PlaySoundOnError;
  type SoundVolume = import("../contract/shared/config").SoundVolume;
  type PaceCaret = import("../contract/shared/config").PaceCaret;
  type AccountChart = import("../contract/shared/config").AccountChart;
  type MinimumWordsPerMinute =
    import("../contract/shared/config").MinimumWordsPerMinute;
  type HighlightMode = import("../contract/shared/config").HighlightMode;
  type TypingSpeedUnit = import("../contract/shared/config").TypingSpeedUnit;
  type Ads = import("../contract/shared/config").Ads;
  type MinimumAccuracy = import("../contract/shared/config").MinimumAccuracy;
  type RepeatQuotes = import("../contract/shared/config").RepeatQuotes;
  type OppositeShiftMode =
    import("../contract/shared/config").OppositeShiftMode;
  type CustomBackgroundSize =
    import("../contract/shared/config").CustomBackgroundSize;
  type CustomBackgroundFilter =
    import("../contract/shared/config").CustomBackgroundFilter;
  type CustomLayoutFluid =
    import("../contract/shared/config").CustomLayoutFluid;
  type MonkeyPowerLevel = import("../contract/shared/config").MonkeyPowerLevel;
  type MinimumBurst = import("../contract/shared/config").MinimumBurst;
  type ShowAverage = import("../contract/shared/config").ShowAverage;
  type TapeMode = import("../contract/shared/config").TapeMode;
}
