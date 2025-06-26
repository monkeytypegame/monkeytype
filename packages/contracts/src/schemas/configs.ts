import { z, ZodSchema } from "zod";
import * as Shared from "./shared";
import * as Themes from "./themes";
import * as Layouts from "./layouts";
import { LanguageSchema } from "./languages";

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

export const QuoteLengthConfigSchema = z.array(QuoteLengthSchema);
export type QuoteLengthConfig = z.infer<typeof QuoteLengthConfigSchema>;

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
  .min(1)
  .max(15);
export type CustomLayoutFluid = z.infer<typeof CustomLayoutFluidSchema>;

export const CustomPolyglotSchema = z.array(LanguageSchema).min(1);
export type CustomPolyglot = z.infer<typeof CustomPolyglotSchema>;

export const MonkeyPowerLevelSchema = z.enum(["off", "1", "2", "3", "4"]);
export type MonkeyPowerLevel = z.infer<typeof MonkeyPowerLevelSchema>;

export const MinimumBurstSchema = z.enum(["off", "fixed", "flex"]);
export type MinimumBurst = z.infer<typeof MinimumBurstSchema>;

export const ShowAverageSchema = z.enum(["off", "speed", "acc", "both"]);
export type ShowAverage = z.infer<typeof ShowAverageSchema>;

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

export const FontFamilySchema = z
  .string()
  .max(50)
  .regex(/^[a-zA-Z0-9_\-+.]+$/);
export type FontFamily = z.infer<typeof FontFamilySchema>;

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
  .url("Needs to be an URI.")
  .regex(/^(https|http):\/\/.*/, "Unsupported protocol.")
  .regex(/^[^`'"]*$/, "May not contain quotes.")
  .regex(/.+(\.png|\.gif|\.jpeg|\.jpg)/gi, "Unsupported image format.")
  .max(2048, "URL is too long.")
  .or(z.literal(""));
export type CustomBackground = z.infer<typeof CustomBackgroundSchema>;

export const ConfigSchema = z
  .object({
    theme: ThemeNameSchema,
    themeLight: ThemeNameSchema,
    themeDark: ThemeNameSchema,
    autoSwitchTheme: z.boolean(),
    customTheme: z.boolean(),
    //customThemeId: token().nonnegative().max(24),
    customThemeColors: CustomThemeColorsSchema,
    favThemes: FavThemesSchema,
    showKeyTips: z.boolean(),
    smoothCaret: SmoothCaretSchema,
    codeUnindentOnBackspace: z.boolean(),
    quickRestart: QuickRestartSchema,
    punctuation: z.boolean(),
    numbers: z.boolean(),
    words: WordCountSchema,
    time: TimeConfigSchema,
    mode: Shared.ModeSchema,
    quoteLength: QuoteLengthConfigSchema,
    language: LanguageSchema,
    fontSize: FontSizeSchema,
    freedomMode: z.boolean(),
    difficulty: DifficultySchema,
    blindMode: z.boolean(),
    quickEnd: z.boolean(),
    caretStyle: CaretStyleSchema,
    paceCaretStyle: CaretStyleSchema,
    flipTestColors: z.boolean(),
    layout: LayoutSchema,
    funbox: FunboxSchema,
    confidenceMode: ConfidenceModeSchema,
    indicateTypos: IndicateTyposSchema,
    timerStyle: TimerStyleSchema,
    liveSpeedStyle: LiveSpeedAccBurstStyleSchema,
    liveAccStyle: LiveSpeedAccBurstStyleSchema,
    liveBurstStyle: LiveSpeedAccBurstStyleSchema,
    colorfulMode: z.boolean(),
    randomTheme: RandomThemeSchema,
    timerColor: TimerColorSchema,
    timerOpacity: TimerOpacitySchema,
    stopOnError: StopOnErrorSchema,
    showAllLines: z.boolean(),
    keymapMode: KeymapModeSchema,
    keymapStyle: KeymapStyleSchema,
    keymapLegendStyle: KeymapLegendStyleSchema,
    keymapLayout: KeymapLayoutSchema,
    keymapShowTopRow: KeymapShowTopRowSchema,
    keymapSize: KeymapSizeSchema,
    fontFamily: FontFamilySchema,
    smoothLineScroll: z.boolean(),
    alwaysShowDecimalPlaces: z.boolean(),
    alwaysShowWordsHistory: z.boolean(),
    singleListCommandLine: SingleListCommandLineSchema,
    capsLockWarning: z.boolean(),
    playSoundOnError: PlaySoundOnErrorSchema,
    playSoundOnClick: PlaySoundOnClickSchema,
    soundVolume: SoundVolumeSchema,
    startGraphsAtZero: z.boolean(),
    showOutOfFocusWarning: z.boolean(),
    paceCaret: PaceCaretSchema,
    paceCaretCustomSpeed: PaceCaretCustomSpeedSchema,
    repeatedPace: z.boolean(),
    accountChart: AccountChartSchema,
    minWpm: MinimumWordsPerMinuteSchema,
    minWpmCustomSpeed: MinWpmCustomSpeedSchema,
    highlightMode: HighlightModeSchema,
    tapeMode: TapeModeSchema,
    tapeMargin: TapeMarginSchema,
    typingSpeedUnit: TypingSpeedUnitSchema,
    ads: AdsSchema,
    hideExtraLetters: z.boolean(),
    strictSpace: z.boolean(),
    minAcc: MinimumAccuracySchema,
    minAccCustom: MinimumAccuracyCustomSchema,
    monkey: z.boolean(),
    repeatQuotes: RepeatQuotesSchema,
    oppositeShiftMode: OppositeShiftModeSchema,
    customBackground: CustomBackgroundSchema,
    customBackgroundSize: CustomBackgroundSizeSchema,
    customBackgroundFilter: CustomBackgroundFilterSchema,
    customLayoutfluid: CustomLayoutFluidSchema,
    monkeyPowerLevel: MonkeyPowerLevelSchema,
    minBurst: MinimumBurstSchema,
    minBurstCustomSpeed: MinimumBurstCustomSpeedSchema,
    burstHeatmap: z.boolean(),
    britishEnglish: z.boolean(),
    lazyMode: z.boolean(),
    showAverage: ShowAverageSchema,
    maxLineWidth: MaxLineWidthSchema,
    customPolyglot: CustomPolyglotSchema,
  } satisfies Record<string, ZodSchema>)
  .strict();

export type Config = z.infer<typeof ConfigSchema>;
export type ConfigKey = keyof Config;
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
  "ads",
  "hidden",
]);

export type ConfigGroupName = z.infer<typeof ConfigGroupNameSchema>;

export const ConfigGroupsLiteral = {
  theme: "theme",
  themeLight: "theme",
  themeDark: "theme",
  autoSwitchTheme: "theme",
  customTheme: "theme",
  customThemeColors: "theme",
  favThemes: "theme",
  showKeyTips: "hideElements",
  smoothCaret: "caret",
  codeUnindentOnBackspace: "input",
  quickRestart: "behavior",
  punctuation: "test",
  numbers: "test",
  words: "test",
  time: "test",
  mode: "test",
  quoteLength: "test",
  language: "test",
  fontSize: "appearance",
  freedomMode: "input",
  difficulty: "behavior",
  blindMode: "behavior",
  quickEnd: "input",
  caretStyle: "caret",
  paceCaretStyle: "caret",
  flipTestColors: "theme",
  layout: "input",
  funbox: "behavior",
  confidenceMode: "input",
  indicateTypos: "input",
  timerStyle: "appearance",
  liveSpeedStyle: "appearance",
  liveAccStyle: "appearance",
  liveBurstStyle: "appearance",
  colorfulMode: "theme",
  randomTheme: "theme",
  timerColor: "appearance",
  timerOpacity: "appearance",
  stopOnError: "input",
  showAllLines: "appearance",
  keymapMode: "appearance",
  keymapStyle: "appearance",
  keymapLegendStyle: "appearance",
  keymapLayout: "appearance",
  keymapShowTopRow: "appearance",
  keymapSize: "appearance",
  fontFamily: "appearance",
  smoothLineScroll: "appearance",
  alwaysShowDecimalPlaces: "appearance",
  alwaysShowWordsHistory: "behavior",
  singleListCommandLine: "behavior",
  capsLockWarning: "hideElements",
  playSoundOnError: "sound",
  playSoundOnClick: "sound",
  soundVolume: "sound",
  startGraphsAtZero: "appearance",
  showOutOfFocusWarning: "hideElements",
  paceCaret: "caret",
  paceCaretCustomSpeed: "caret",
  repeatedPace: "caret",
  accountChart: "hidden",
  minWpm: "behavior",
  minWpmCustomSpeed: "behavior",
  highlightMode: "appearance",
  tapeMode: "appearance",
  tapeMargin: "appearance",
  typingSpeedUnit: "appearance",
  ads: "ads",
  hideExtraLetters: "input",
  strictSpace: "input",
  minAcc: "behavior",
  minAccCustom: "behavior",
  monkey: "hidden",
  repeatQuotes: "behavior",
  oppositeShiftMode: "input",
  customBackground: "theme",
  customBackgroundSize: "theme",
  customBackgroundFilter: "theme",
  customLayoutfluid: "behavior",
  monkeyPowerLevel: "hidden",
  minBurst: "behavior",
  minBurstCustomSpeed: "behavior",
  burstHeatmap: "test",
  britishEnglish: "behavior",
  lazyMode: "input",
  showAverage: "hideElements",
  maxLineWidth: "appearance",
  customPolyglot: "behavior",
} as const satisfies Record<ConfigKey, ConfigGroupName>;

export type ConfigGroups = typeof ConfigGroupsLiteral;
