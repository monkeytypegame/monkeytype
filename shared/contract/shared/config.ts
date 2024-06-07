import { z } from "zod";

export const SmoothCaretSchema = z.enum(["off", "slow", "medium", "fast"]);
export type SmoothCaret = z.infer<typeof SmoothCaretSchema>;

export const QuickRestartSchema = z.enum(["off", "esc", "tab", "enter"]);
export type QuickRestart = z.infer<typeof QuickRestartSchema>;

export const QuoteLengthSchema = z.union([
  z.literal(-3),
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type QuoteLength = z.infer<typeof QuoteLengthSchema>;

export const DifficultySchema = z.enum(["normal", "expert", "master"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const CaretStyleSchema = z.enum([
  "off",
  "default",
  "block",
  "outline",
  "underline",
  "carrot",
  "banana",
]);
export type CaretStyle = z.infer<typeof CaretStyleSchema>;

export const ConfidenceModeSchema = z.enum(["off", "on", "max"]);
export type ConfidenceMode = z.infer<typeof ConfidenceModeSchema>;

export const IndicateTyposSchema = z.enum(["off", "below", "replace"]);
export type IndicateTypos = z.infer<typeof IndicateTyposSchema>;

export const TimerStyleSchema = z.enum(["off", "bar", "text", "mini"]);
export type TimerStyle = z.infer<typeof TimerStyleSchema>;

export const LiveSpeedAccBurstStyleSchema = z.enum(["off", "text", "mini"]);
export type LiveSpeedAccBurstStyle = z.infer<
  typeof LiveSpeedAccBurstStyleSchema
>;

export const RandomThemeSchema = z.enum([
  "off",
  "on",
  "fav",
  "light",
  "dark",
  "custom",
]);
export type RandomTheme = z.infer<typeof RandomThemeSchema>;

export const TimerColorSchema = z.enum(["black", "sub", "text", "main"]);
export type TimerColor = z.infer<typeof TimerColorSchema>;

export const TimerOpacitySchema = z.enum(["0.25", "0.5", "0.75", "1"]);
export type TimerOpacity = z.infer<typeof TimerOpacitySchema>;

export const StopOnErrorSchema = z.enum(["off", "word", "letter"]);
export type StopOnError = z.infer<typeof StopOnErrorSchema>;

export const KeymapModeSchema = z.enum(["off", "static", "react", "next"]);
export type KeymapMode = z.infer<typeof KeymapModeSchema>;

export const KeymapStyleSchema = z.enum([
  "staggered",
  "alice",
  "matrix",
  "split",
  "split_matrix",
  "steno",
  "steno_matrix",
]);
export type KeymapStyle = z.infer<typeof KeymapStyleSchema>;

export const KeymapLegendStyleSchema = z.enum([
  "lowercase",
  "uppercase",
  "blank",
  "dynamic",
]);
export type KeymapLegendStyle = z.infer<typeof KeymapLegendStyleSchema>;

export const KeymapShowTopRowSchema = z.enum(["always", "layout", "never"]);
export type KeymapShowTopRow = z.infer<typeof KeymapShowTopRowSchema>;

export const SingleListCommandLineSchema = z.enum(["manual", "on"]);
export type SingleListCommandLine = z.infer<typeof SingleListCommandLineSchema>;

export const PlaySoundOnErrorSchema = z.enum(["off", "1", "2", "3", "4"]);
export type PlaySoundOnError = z.infer<typeof PlaySoundOnErrorSchema>;

export const PlaySoundOnClickSchema = z.enum([
  "off",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
]);
export type PlaySoundOnClick = z.infer<typeof PlaySoundOnClickSchema>;

export const SoundVolumeSchema = z.enum(["0.1", "0.5", "1.0"]);
export type SoundVolume = z.infer<typeof SoundVolumeSchema>;

export const PaceCaretSchema = z.enum([
  "off",
  "average",
  "pb",
  "last",
  "custom",
  "daily",
]);
export type PaceCaret = z.infer<typeof PaceCaretSchema>;

export const AccountChartSchema = z.tuple([
  z.enum(["on", "off"]),
  z.enum(["on", "off"]),
  z.enum(["on", "off"]),
  z.enum(["on", "off"]),
]);
export type AccountChart = z.infer<typeof AccountChartSchema>;

export const MinimumWordsPerMinuteSchema = z.enum(["off", "custom"]);
export type MinimumWordsPerMinute = z.infer<typeof MinimumWordsPerMinuteSchema>;

export const HighlightModeSchema = z.enum([
  "off",
  "letter",
  "word",
  "next_word",
  "next_two_words",
  "next_three_words",
]);
export type HighlightMode = z.infer<typeof HighlightModeSchema>;

export const TapeModeSchema = z.enum(["off", "letter", "word"]);
export type TapeMode = z.infer<typeof TapeModeSchema>;

export const TypingSpeedUnitSchema = z.enum([
  "wpm",
  "cpm",
  "wps",
  "cps",
  "wph",
]);
export type TypingSpeedUnit = z.infer<typeof TypingSpeedUnitSchema>;

export const AdsSchema = z.enum(["off", "result", "on", "sellout"]);
export type Ads = z.infer<typeof AdsSchema>;

export const MinimumAccuracySchema = z.enum(["off", "custom"]);
export type MinimumAccuracy = z.infer<typeof MinimumAccuracySchema>;

export const RepeatQuotesSchema = z.enum(["off", "typing"]);
export type RepeatQuotes = z.infer<typeof RepeatQuotesSchema>;

export const OppositeShiftModeSchema = z.enum(["off", "on", "keymap"]);
export type OppositeShiftMode = z.infer<typeof OppositeShiftModeSchema>;

export const CustomBackgroundSizeSchema = z.enum(["cover", "contain", "max"]);
export type CustomBackgroundSize = z.infer<typeof CustomBackgroundSizeSchema>;

export const CustomBackgroundFilterSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);
export type CustomBackgroundFilter = z.infer<
  typeof CustomBackgroundFilterSchema
>;

export const CustomLayoutFluidSchema = z.string().regex(/^[0-9a-zA-Z_#]+$/); //TODO better regex
export type CustomLayoutFluid = z.infer<typeof CustomLayoutFluidSchema>;

export const MonkeyPowerLevelSchema = z.enum(["off", "1", "2", "3", "4"]);
export type MonkeyPowerLevel = z.infer<typeof MonkeyPowerLevelSchema>;

export const MinimumBurstSchema = z.enum(["off", "fixed", "flex"]);
export type MinimumBurst = z.infer<typeof MinimumBurstSchema>;

export const ShowAverageSchema = z.enum(["off", "speed", "acc", "both"]);
export type ShowAverage = z.infer<typeof ShowAverageSchema>;
