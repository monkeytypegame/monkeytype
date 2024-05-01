/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace SharedTypes.Config {
  type SmoothCaret = "off" | "slow" | "medium" | "fast";
  type QuickRestart = "off" | "esc" | "tab" | "enter";
  type QuoteLength = -3 | -2 | -1 | 0 | 1 | 2 | 3;
  type CaretStyle =
    | "off"
    | "default"
    | "block"
    | "outline"
    | "underline"
    | "carrot"
    | "banana";
  type Difficulty = "normal" | "expert" | "master";
  type Mode = keyof PersonalBests;
  type Mode2<M extends Mode> = M extends M ? keyof PersonalBests[M] : never;
  type Mode2Custom<M extends Mode> = Mode2<M> | "custom";
  type ConfidenceMode = "off" | "on" | "max";
  type IndicateTypos = "off" | "below" | "replace";
  type TimerStyle = "off" | "bar" | "text" | "mini";
  type LiveSpeedAccBurstStyle = "off" | "text" | "mini";
  type RandomTheme = "off" | "on" | "fav" | "light" | "dark" | "custom";
  type TimerColor = "black" | "sub" | "text" | "main";
  type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";
  type StopOnError = "off" | "word" | "letter";
  type KeymapMode = "off" | "static" | "react" | "next";
  type KeymapStyle =
    | "staggered"
    | "alice"
    | "matrix"
    | "split"
    | "split_matrix"
    | "steno"
    | "steno_matrix";
  type KeymapLegendStyle = "lowercase" | "uppercase" | "blank" | "dynamic";
  type KeymapShowTopRow = "always" | "layout" | "never";
  type SingleListCommandLine = "manual" | "on";
  type PlaySoundOnClick =
    | "off"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10"
    | "11"
    | "12"
    | "13"
    | "14"
    | "15";
  type PlaySoundOnError = "off" | "1" | "2" | "3" | "4";
  type SoundVolume = "0.1" | "0.5" | "1.0";
  type PaceCaret = "off" | "average" | "pb" | "last" | "custom" | "daily";
  type AccountChart = ["off" | "on", "off" | "on", "off" | "on", "off" | "on"];
  type MinimumWordsPerMinute = "off" | "custom";
  type HighlightMode =
    | "off"
    | "letter"
    | "word"
    | "next_word"
    | "next_two_words"
    | "next_three_words";
  type TypingSpeedUnit = "wpm" | "cpm" | "wps" | "cps" | "wph";
  type Ads = "off" | "result" | "on" | "sellout";
  type MinimumAccuracy = "off" | "custom";
  type RepeatQuotes = "off" | "typing";
  type OppositeShiftMode = "off" | "on" | "keymap";
  type CustomBackgroundSize = "cover" | "contain" | "max";
  type CustomBackgroundFilter = [number, number, number, number, number];
  type CustomLayoutFluid = `${string}#${string}#${string}`;
  type MonkeyPowerLevel = "off" | "1" | "2" | "3" | "4";
  type MinimumBurst = "off" | "fixed" | "flex";
  type ShowAverage = "off" | "speed" | "acc" | "both";
  type TapeMode = "off" | "letter" | "word";
}
