import { z, ZodSchema } from "zod";
import * as Shared from "./shared";
import * as Themes from "./themes";
import * as Layouts from "./layouts";
import { LanguageSchema } from "./languages";
import { FontNameSchema } from "./fonts";

export const SmoothCaretSchema = z.enum(["off", "slow", "medium", "fast"]);
export type SmoothCaret = z.infer<typeof SmoothCaretSchema>;

export const QuickRestartSchema = z.enum(["off", "esc", "tab", "enter"]);
export type QuickRestart = z.infer<typeof QuickRestartSchema>;

export const QuoteLengthSchema = z.union([
  z.literal(-3),
  z.literal(-2),
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type QuoteLength = z.infer<typeof QuoteLengthSchema>;

export const QuoteLengthConfigSchema = z
  .array(QuoteLengthSchema)
  .describe(
    [
      "|value|description|\n|-|-|",
      "|-3|Favorite quotes|",
      "|-2|Quote search|",
      "|0|Short quotes|",
      "|1|Medium quotes|",
      "|2|Long quotes|",
      "|3|Thicc quotes|",
    ].join("\n"),
  );
export type QuoteLengthConfig = z.infer<typeof QuoteLengthConfigSchema>;

export const CaretStyleSchema = z.enum([
  "off",
  "default",
  "block",
  "outline",
  "underline",
  "carrot",
  "banana",
  "monkey",
]);
export type CaretStyle = z.infer<typeof CaretStyleSchema>;

export const ConfidenceModeSchema = z.enum(["off", "on", "max"]);
export type ConfidenceMode = z.infer<typeof ConfidenceModeSchema>;

export const IndicateTyposSchema = z.enum(["off", "below", "replace", "both"]);
export type IndicateTypos = z.infer<typeof IndicateTyposSchema>;

export const CompositionDisplaySchema = z.enum(["off", "below", "replace"]);
export type CompositionDisplay = z.infer<typeof CompositionDisplaySchema>;

export const TimerStyleSchema = z.enum([
  "off",
  "bar",
  "text",
  "mini",
  "flash_text",
  "flash_mini",
]);
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
  "auto",
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

export const KeymapSizeSchema = z.number().min(0.5).max(3.5).step(0.1);
export type KeymapSize = z.infer<typeof KeymapSizeSchema>;

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
  "16",
]);
export type PlaySoundOnClick = z.infer<typeof PlaySoundOnClickSchema>;

export const SoundVolumeSchema = z.number().min(0).max(1);
export type SoundVolume = z.infer<typeof SoundVolumeSchema>;

export const PaceCaretSchema = z.enum([
  "off",
  "average",
  "pb",
  "tagPb",
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

export const TypedEffectSchema = z.enum(["keep", "hide", "fade", "dots"]);
export type TypedEffect = z.infer<typeof TypedEffectSchema>;

export const TapeModeSchema = z.enum(["off", "letter", "word"]);
export type TapeMode = z.infer<typeof TapeModeSchema>;

export const TapeMarginSchema = z.number().min(10).max(90);
export type TapeMargin = z.infer<typeof TapeMarginSchema>;

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
]);
export type CustomBackgroundFilter = z.infer<
  typeof CustomBackgroundFilterSchema
>;

export const CustomLayoutFluidSchema = z
  .array(Layouts.LayoutNameSchema)
  .min(2)
  .max(15);
export type CustomLayoutFluid = z.infer<typeof CustomLayoutFluidSchema>;

export const CustomPolyglotSchema = z.array(LanguageSchema).min(2);
export type CustomPolyglot = z.infer<typeof CustomPolyglotSchema>;

export const MonkeyPowerLevelSchema = z.enum(["off", "1", "2", "3", "4"]);
export type MonkeyPowerLevel = z.infer<typeof MonkeyPowerLevelSchema>;

export const MinimumBurstSchema = z.enum(["off", "fixed", "flex"]);
export type MinimumBurst = z.infer<typeof MinimumBurstSchema>;

export const ShowAverageSchema = z.enum(["off", "speed", "acc", "both"]);
export type ShowAverage = z.infer<typeof ShowAverageSchema>;

export const ShowPbSchema = z.boolean();
export type ShowPb = z.infer<typeof ShowPbSchema>;

export const ColorHexValueSchema = z.string().regex(/^#([\da-f]{3}){1,2}$/i);
export type ColorHexValue = z.infer<typeof ColorHexValueSchema>;

export const DifficultySchema = Shared.DifficultySchema;
export type Difficulty = Shared.Difficulty;

export const CustomThemeColorsSchema = z.tuple([
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
]);
export type CustomThemeColors = z.infer<typeof CustomThemeColorsSchema>;

export const ThemeNameSchema = Themes.ThemeNameSchema;
export type ThemeName = z.infer<typeof ThemeNameSchema>;

export const FavThemesSchema = z.array(ThemeNameSchema);
export type FavThemes = z.infer<typeof FavThemesSchema>;

export const FunboxNameSchema = z.enum([
  "58008",
  "mirror",
  "upside_down",
  "nausea",
  "round_round_baby",
  "simon_says",
  "tts",
  "choo_choo",
  "arrows",
  "rAnDoMcAsE",
  "sPoNgEcAsE",
  "capitals",
  "layout_mirror",
  "layoutfluid",
  "earthquake",
  "space_balls",
  "gibberish",
  "ascii",
  "specials",
  "plus_one",
  "plus_zero",
  "plus_two",
  "plus_three",
  "read_ahead_easy",
  "read_ahead",
  "read_ahead_hard",
  "memory",
  "nospace",
  "poetry",
  "wikipedia",
  "weakspot",
  "pseudolang",
  "IPv4",
  "IPv6",
  "binary",
  "hexadecimal",
  "zipf",
  "morse",
  "crt",
  "backwards",
  "ddoouubblleedd",
  "instant_messaging",
  "underscore_spaces",
  "ALL_CAPS",
  "polyglot",
  "asl",
  "rot13",
  "no_quit",
]);
export type FunboxName = z.infer<typeof FunboxNameSchema>;

export const FunboxSchema = z.array(FunboxNameSchema).max(15);
export type Funbox = z.infer<typeof FunboxSchema>;

export const PaceCaretCustomSpeedSchema = z.number().nonnegative();
export type PaceCaretCustomSpeed = z.infer<typeof PaceCaretCustomSpeedSchema>;

export const MinWpmCustomSpeedSchema = z.number().nonnegative();
export type MinWpmCustomSpeed = z.infer<typeof MinWpmCustomSpeedSchema>;

export const MinimumAccuracyCustomSchema = z.number().nonnegative().max(100);
export type MinimumAccuracyCustom = z.infer<typeof MinimumAccuracyCustomSchema>;

export const MinimumBurstCustomSpeedSchema = z.number().nonnegative();
export type MinimumBurstCustomSpeed = z.infer<
  typeof MinimumBurstCustomSpeedSchema
>;

export const TimeConfigSchema = z.number().int().nonnegative();
export type TimeConfig = z.infer<typeof TimeConfigSchema>;

export const WordCountSchema = z.number().int().nonnegative();
export type WordCount = z.infer<typeof WordCountSchema>;

export const KeymapLayoutSchema = z
  .literal("overrideSync")
  .or(Layouts.LayoutNameSchema);
export type KeymapLayout = z.infer<typeof KeymapLayoutSchema>;

export const LayoutSchema = z.literal("default").or(Layouts.LayoutNameSchema);
export type Layout = z.infer<typeof LayoutSchema>;

export const FontSizeSchema = z.number().positive();
export type FontSize = z.infer<typeof FontSizeSchema>;

export const MaxLineWidthSchema = z.number().min(20).max(1000).or(z.literal(0));
export type MaxLineWidth = z.infer<typeof MaxLineWidthSchema>;

export const CustomBackgroundSchema = z
  .string()
  .url("Needs to be an URI")
  .regex(/^(https|http):\/\/.*/, "Unsupported protocol")
  .regex(/^[^`'"]*$/, "May not contain quotes")
  .regex(/.+(\.png|\.gif|\.jpeg|\.jpg|\.webp)/gi, "Unsupported image format")
  .max(2048, "URL is too long")
  .or(z.literal(""));
export type CustomBackground = z.infer<typeof CustomBackgroundSchema>;

export const PlayTimeWarningSchema = z
  .enum(["off", "1", "3", "5", "10"])
  .describe(
    "How many seconds before the end of the test to play a warning sound.",
  );
export type PlayTimeWarning = z.infer<typeof PlayTimeWarningSchema>;

export const ConfigSchema = z
  .object({
    // test
    punctuation: z.boolean(),
    numbers: z.boolean(),
    words: WordCountSchema,
    time: TimeConfigSchema,
    mode: Shared.ModeSchema,
    quoteLength: QuoteLengthConfigSchema,
    language: LanguageSchema,
    burstHeatmap: z.boolean(),

    // behavior
    difficulty: DifficultySchema,
    quickRestart: QuickRestartSchema,
    repeatQuotes: RepeatQuotesSchema,
    blindMode: z.boolean(),
    alwaysShowWordsHistory: z.boolean(),
    singleListCommandLine: SingleListCommandLineSchema,
    minWpm: MinimumWordsPerMinuteSchema,
    minWpmCustomSpeed: MinWpmCustomSpeedSchema,
    minAcc: MinimumAccuracySchema,
    minAccCustom: MinimumAccuracyCustomSchema,
    minBurst: MinimumBurstSchema,
    minBurstCustomSpeed: MinimumBurstCustomSpeedSchema,
    britishEnglish: z.boolean(),
    funbox: FunboxSchema,
    customLayoutfluid: CustomLayoutFluidSchema,
    customPolyglot: CustomPolyglotSchema,

    // input
    freedomMode: z.boolean(),
    strictSpace: z.boolean(),
    oppositeShiftMode: OppositeShiftModeSchema,
    stopOnError: StopOnErrorSchema,
    confidenceMode: ConfidenceModeSchema,
    quickEnd: z.boolean(),
    indicateTypos: IndicateTyposSchema,
    compositionDisplay: CompositionDisplaySchema,
    hideExtraLetters: z.boolean(),
    lazyMode: z.boolean(),
    layout: LayoutSchema,
    codeUnindentOnBackspace: z.boolean(),

    // sound
    soundVolume: SoundVolumeSchema,
    playSoundOnClick: PlaySoundOnClickSchema,
    playSoundOnError: PlaySoundOnErrorSchema,
    playTimeWarning: PlayTimeWarningSchema,

    // caret
    smoothCaret: SmoothCaretSchema,
    caretStyle: CaretStyleSchema,
    paceCaret: PaceCaretSchema,
    paceCaretCustomSpeed: PaceCaretCustomSpeedSchema,
    paceCaretStyle: CaretStyleSchema,
    repeatedPace: z.boolean(),

    // appearance
    timerStyle: TimerStyleSchema,
    liveSpeedStyle: LiveSpeedAccBurstStyleSchema,
    liveAccStyle: LiveSpeedAccBurstStyleSchema,
    liveBurstStyle: LiveSpeedAccBurstStyleSchema,
    timerColor: TimerColorSchema,
    timerOpacity: TimerOpacitySchema,
    highlightMode: HighlightModeSchema,
    typedEffect: TypedEffectSchema,
    tapeMode: TapeModeSchema,
    tapeMargin: TapeMarginSchema,
    smoothLineScroll: z.boolean(),
    showAllLines: z.boolean(),
    alwaysShowDecimalPlaces: z.boolean(),
    typingSpeedUnit: TypingSpeedUnitSchema,
    startGraphsAtZero: z.boolean(),
    maxLineWidth: MaxLineWidthSchema,
    fontSize: FontSizeSchema,
    fontFamily: FontNameSchema,
    keymapMode: KeymapModeSchema,
    keymapLayout: KeymapLayoutSchema,
    keymapStyle: KeymapStyleSchema,
    keymapLegendStyle: KeymapLegendStyleSchema,
    keymapShowTopRow: KeymapShowTopRowSchema,
    keymapSize: KeymapSizeSchema,

    // theme
    flipTestColors: z.boolean(),
    colorfulMode: z.boolean(),
    customBackground: CustomBackgroundSchema,
    customBackgroundSize: CustomBackgroundSizeSchema,
    customBackgroundFilter: CustomBackgroundFilterSchema,
    autoSwitchTheme: z.boolean(),
    themeLight: ThemeNameSchema,
    themeDark: ThemeNameSchema,
    randomTheme: RandomThemeSchema,
    favThemes: FavThemesSchema,
    theme: ThemeNameSchema,
    customTheme: z.boolean(),
    customThemeColors: CustomThemeColorsSchema,

    // hide elements
    showKeyTips: z.boolean(),
    showOutOfFocusWarning: z.boolean(),
    capsLockWarning: z.boolean(),
    showAverage: ShowAverageSchema,
    showPb: ShowPbSchema,

    // other (hidden)
    accountChart: AccountChartSchema,
    monkey: z.boolean(),
    monkeyPowerLevel: MonkeyPowerLevelSchema,

    // ads
    ads: AdsSchema,
  } satisfies Record<string, ZodSchema>)
  .strict();

export type Config = z.infer<typeof ConfigSchema>;
export const ConfigKeySchema = ConfigSchema.keyof();
export type ConfigKey = z.infer<typeof ConfigKeySchema>;
export type ConfigValue = Config[keyof Config];

export const PartialConfigSchema = ConfigSchema.partial();
export type PartialConfig = z.infer<typeof PartialConfigSchema>;

export const ConfigGroupNameSchema = z.enum([
  "test",
  "behavior",
  "input",
  "sound",
  "caret",
  "appearance",
  "theme",
  "hideElements",
  "hidden",
  "ads",
]);
export type ConfigGroupName = z.infer<typeof ConfigGroupNameSchema>;
