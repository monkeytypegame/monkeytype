import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  AccountChartSchema,
  AdsSchema,
  CaretStyleSchema,
  ConfidenceModeSchema,
  CustomBackgroundFilterSchema,
  CustomBackgroundSizeSchema,
  CustomLayoutFluidSchema,
  CustomThemeColorsSchema,
  HighlightModeSchema,
  IndicateTyposSchema,
  KeymapLegendStyleSchema,
  KeymapModeSchema,
  KeymapShowTopRowSchema,
  KeymapStyleSchema,
  LiveSpeedAccBurstStyleSchema,
  MinimumAccuracySchema,
  MinimumBurstSchema,
  MinimumWordsPerMinuteSchema,
  MonkeyPowerLevelSchema,
  OppositeShiftModeSchema,
  PaceCaretSchema,
  PlaySoundOnClickSchema,
  PlaySoundOnErrorSchema,
  QuickRestartSchema,
  QuoteLengthSchema,
  RandomThemeSchema,
  RepeatQuotesSchema,
  ShowAverageSchema,
  SingleListCommandLineSchema,
  SmoothCaretSchema,
  SoundVolumeSchema,
  StopOnErrorSchema,
  TapeModeSchema,
  TimerColorSchema,
  TimerOpacitySchema,
  TimerStyleSchema,
  TypingSpeedUnitSchema,
} from "./shared/config";
import { token } from "./shared/helpers";
import {
  DifficultySchema,
  ModeSchema,
  MonkeyErrorResponseSchema,
  MonkeyResponseSchema,
} from "./shared/types";

export const ConfigSchema = z.object({
  theme: token().max(50),
  themeLight: token().max(50),
  themeDark: token().max(50),
  autoSwitchTheme: z.boolean(),
  customTheme: z.boolean(),
  //customThemeId: token().nonnegative().max(24),
  customThemeColors: CustomThemeColorsSchema,
  favThemes: z.array(token().max(50)),
  showKeyTips: z.boolean(),
  smoothCaret: SmoothCaretSchema,
  quickRestart: QuickRestartSchema,
  punctuation: z.boolean(),
  numbers: z.boolean(),
  words: z.number().int().nonnegative(),
  time: z.number().int().nonnegative(),
  mode: ModeSchema,
  quoteLength: z.array(QuoteLengthSchema),
  language: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_+]+$/),
  fontSize: z.number(),
  freedomMode: z.boolean(),
  difficulty: DifficultySchema,
  blindMode: z.boolean(),
  quickEnd: z.boolean(),
  caretStyle: CaretStyleSchema,
  paceCaretStyle: CaretStyleSchema,
  flipTestColors: z.boolean(),
  layout: token().max(50),
  funbox: z
    .string()
    .max(100)
    .regex(/[\w#]+/),
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
  keymapLayout: z
    .string()
    .max(50)
    .regex(/[\w-_]+/),
  keymapShowTopRow: KeymapShowTopRowSchema,
  fontFamily: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_\-+.]+$/),
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
  paceCaretCustomSpeed: z.number().nonnegative(),
  repeatedPace: z.boolean(),
  accountChart: AccountChartSchema,
  minWpm: MinimumWordsPerMinuteSchema,
  minWpmCustomSpeed: z.number().nonnegative(),
  highlightMode: HighlightModeSchema,
  tapeMode: TapeModeSchema,
  typingSpeedUnit: TypingSpeedUnitSchema,
  ads: AdsSchema,
  hideExtraLetters: z.boolean(),
  strictSpace: z.boolean(),
  minAcc: MinimumAccuracySchema,
  minAccCustom: z.number().nonnegative(),
  monkey: z.boolean(),
  repeatQuotes: RepeatQuotesSchema,
  oppositeShiftMode: OppositeShiftModeSchema,
  customBackground: z.string().url().or(z.literal("")),
  customBackgroundSize: CustomBackgroundSizeSchema,
  customBackgroundFilter: CustomBackgroundFilterSchema,
  customLayoutfluid: CustomLayoutFluidSchema,
  monkeyPowerLevel: MonkeyPowerLevelSchema,
  minBurst: MinimumBurstSchema,
  minBurstCustomSpeed: z.number().nonnegative(),
  burstHeatmap: z.boolean(),
  britishEnglish: z.boolean(),
  lazyMode: z.boolean(),
  showAverage: ShowAverageSchema,
  maxLineWidth: z.number().min(20).max(1000).or(z.literal(0)),
});
export type Config = z.infer<typeof ConfigSchema>;

export const ConfigWrappedSchema = z.object({
  _id: z.string(),
  uid: z.string(),
  config: ConfigSchema,
});
export type ConfigWrapped = z.infer<typeof ConfigWrappedSchema>;

export const ConfigUpdateBodySchema = z.object({
  config: ConfigSchema.partial(),
});
export type ConfigUpdateBody = z.infer<typeof ConfigUpdateBodySchema>;

const c = initContract();

export const configsContract = c.router(
  {
    get: {
      method: "GET",
      path: "/",
      responses: {
        200: MonkeyResponseSchema.extend({ data: ConfigWrappedSchema }),
        400: MonkeyErrorResponseSchema,
      },
    },
    save: {
      method: "PATCH",
      path: "/",
      body: ConfigUpdateBodySchema,
      responses: {
        200: MonkeyResponseSchema,
        400: MonkeyErrorResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/configs",
    strictStatusCodes: true,
  }
);
