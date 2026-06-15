import { it, expect, describe } from "vitest";
import {
  SmoothCaretSchema,
  QuickRestartSchema,
  QuoteLengthSchema,
  CaretStyleSchema,
  ConfidenceModeSchema,
  IndicateTyposSchema,
  CompositionDisplaySchema,
  TimerStyleSchema,
  LiveSpeedAccBurstStyleSchema,
  RandomThemeSchema,
  TimerColorSchema,
  TimerOpacitySchema,
  StopOnErrorSchema,
  KeymapModeSchema,
  KeymapStyleSchema,
  KeymapLegendStyleSchema,
  KeymapShowTopRowSchema,
  SingleListCommandLineSchema,
  PlaySoundOnErrorSchema,
  PlaySoundOnClickSchema,
  PaceCaretSchema,
  MinimumWordsPerMinuteSchema,
  HighlightModeSchema,
  TypedEffectSchema,
  TapeModeSchema,
  TypingSpeedUnitSchema,
  AdsSchema,
  MinimumAccuracySchema,
  RepeatQuotesSchema,
  OppositeShiftModeSchema,
  CustomBackgroundSchema,
  CustomBackgroundSizeSchema,
  MonkeyPowerLevelSchema,
  MinimumBurstSchema,
  ShowAverageSchema,
  FunboxNameSchema,
  PlayTimeWarningSchema,
  ConfigGroupNameSchema,
} from "../src/configs";

describe("configs schemas", () => {
  describe("SmoothCaretSchema", () => {
    it.each([
      {
        description: "valid value 'off'",
        input: "off",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'slow' | 'medium' | 'fast', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(SmoothCaretSchema).toReject(input, expectedError);
      } else {
        expect(SmoothCaretSchema).toValidate(input);
      }
    });
  });

  describe("QuickRestartSchema", () => {
    it.each([
      {
        description: "valid value 'esc'",
        input: "esc",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'esc' | 'tab' | 'enter', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuickRestartSchema).toReject(input, expectedError);
      } else {
        expect(QuickRestartSchema).toValidate(input);
      }
    });
  });

  describe("QuoteLengthSchema", () => {
    it.each([
      {
        description: "valid value -3",
        input: -3,
      },
      {
        description: "invalid value",
        input: 4,
        expectedError: "Invalid input",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteLengthSchema).toReject(input, expectedError);
      } else {
        expect(QuoteLengthSchema).toValidate(input);
      }
    });
  });

  describe("CaretStyleSchema", () => {
    it.each([
      {
        description: "valid value 'monkey'",
        input: "monkey",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'default' | 'block' | 'outline' | 'underline' | 'carrot' | 'banana' | 'monkey', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CaretStyleSchema).toReject(input, expectedError);
      } else {
        expect(CaretStyleSchema).toValidate(input);
      }
    });
  });

  describe("ConfidenceModeSchema", () => {
    it.each([
      {
        description: "valid value 'max'",
        input: "max",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'on' | 'max', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ConfidenceModeSchema).toReject(input, expectedError);
      } else {
        expect(ConfidenceModeSchema).toValidate(input);
      }
    });
  });

  describe("IndicateTyposSchema", () => {
    it.each([
      {
        description: "valid value 'both'",
        input: "both",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'below' | 'replace' | 'both', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(IndicateTyposSchema).toReject(input, expectedError);
      } else {
        expect(IndicateTyposSchema).toValidate(input);
      }
    });
  });

  describe("CompositionDisplaySchema", () => {
    it.each([
      {
        description: "valid value 'replace'",
        input: "replace",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'below' | 'replace', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CompositionDisplaySchema).toReject(input, expectedError);
      } else {
        expect(CompositionDisplaySchema).toValidate(input);
      }
    });
  });

  describe("TimerStyleSchema", () => {
    it.each([
      {
        description: "valid value 'flash_mini'",
        input: "flash_mini",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'bar' | 'text' | 'mini' | 'flash_text' | 'flash_mini', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TimerStyleSchema).toReject(input, expectedError);
      } else {
        expect(TimerStyleSchema).toValidate(input);
      }
    });
  });

  describe("LiveSpeedAccBurstStyleSchema", () => {
    it.each([
      {
        description: "valid value 'mini'",
        input: "mini",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'text' | 'mini', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(LiveSpeedAccBurstStyleSchema).toReject(input, expectedError);
      } else {
        expect(LiveSpeedAccBurstStyleSchema).toValidate(input);
      }
    });
  });

  describe("RandomThemeSchema", () => {
    it.each([
      {
        description: "valid value 'auto'",
        input: "auto",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'on' | 'fav' | 'light' | 'dark' | 'custom' | 'auto', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(RandomThemeSchema).toReject(input, expectedError);
      } else {
        expect(RandomThemeSchema).toValidate(input);
      }
    });
  });

  describe("TimerColorSchema", () => {
    it.each([
      {
        description: "valid value 'main'",
        input: "main",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'black' | 'sub' | 'text' | 'main', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TimerColorSchema).toReject(input, expectedError);
      } else {
        expect(TimerColorSchema).toValidate(input);
      }
    });
  });

  describe("TimerOpacitySchema", () => {
    it.each([
      {
        description: "valid value '0.75'",
        input: "0.75",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected '0.25' | '0.5' | '0.75' | '1', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TimerOpacitySchema).toReject(input, expectedError);
      } else {
        expect(TimerOpacitySchema).toValidate(input);
      }
    });
  });

  describe("StopOnErrorSchema", () => {
    it.each([
      {
        description: "valid value 'letter'",
        input: "letter",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'word' | 'letter', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(StopOnErrorSchema).toReject(input, expectedError);
      } else {
        expect(StopOnErrorSchema).toValidate(input);
      }
    });
  });

  describe("KeymapModeSchema", () => {
    it.each([
      {
        description: "valid value 'react'",
        input: "react",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'static' | 'react' | 'next', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(KeymapModeSchema).toReject(input, expectedError);
      } else {
        expect(KeymapModeSchema).toValidate(input);
      }
    });
  });

  describe("KeymapStyleSchema", () => {
    it.each([
      {
        description: "valid value 'steno_matrix'",
        input: "steno_matrix",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'staggered' | 'alice' | 'matrix' | 'split' | 'split_matrix' | 'steno' | 'steno_matrix', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(KeymapStyleSchema).toReject(input, expectedError);
      } else {
        expect(KeymapStyleSchema).toValidate(input);
      }
    });
  });

  describe("KeymapLegendStyleSchema", () => {
    it.each([
      {
        description: "valid value 'dynamic'",
        input: "dynamic",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'lowercase' | 'uppercase' | 'blank' | 'dynamic', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(KeymapLegendStyleSchema).toReject(input, expectedError);
      } else {
        expect(KeymapLegendStyleSchema).toValidate(input);
      }
    });
  });

  describe("KeymapShowTopRowSchema", () => {
    it.each([
      {
        description: "valid value 'layout'",
        input: "layout",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'always' | 'layout' | 'never', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(KeymapShowTopRowSchema).toReject(input, expectedError);
      } else {
        expect(KeymapShowTopRowSchema).toValidate(input);
      }
    });
  });

  describe("SingleListCommandLineSchema", () => {
    it.each([
      {
        description: "valid value 'on'",
        input: "on",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'manual' | 'on', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(SingleListCommandLineSchema).toReject(input, expectedError);
      } else {
        expect(SingleListCommandLineSchema).toValidate(input);
      }
    });
  });

  describe("PlaySoundOnErrorSchema", () => {
    it.each([
      {
        description: "valid value '3'",
        input: "3",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | '1' | '2' | '3' | '4', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PlaySoundOnErrorSchema).toReject(input, expectedError);
      } else {
        expect(PlaySoundOnErrorSchema).toValidate(input);
      }
    });
  });

  describe("PlaySoundOnClickSchema", () => {
    it.each([
      {
        description: "valid value '13'",
        input: "13",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24' | '25' | '26', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PlaySoundOnClickSchema).toReject(input, expectedError);
      } else {
        expect(PlaySoundOnClickSchema).toValidate(input);
      }
    });
  });

  describe("PaceCaretSchema", () => {
    it.each([
      {
        description: "valid value 'daily'",
        input: "daily",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'average' | 'pb' | 'tagPb' | 'last' | 'custom' | 'daily', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PaceCaretSchema).toReject(input, expectedError);
      } else {
        expect(PaceCaretSchema).toValidate(input);
      }
    });
  });

  describe("MinimumWordsPerMinuteSchema", () => {
    it.each([
      {
        description: "valid value 'custom'",
        input: "custom",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'custom', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(MinimumWordsPerMinuteSchema).toReject(input, expectedError);
      } else {
        expect(MinimumWordsPerMinuteSchema).toValidate(input);
      }
    });
  });

  describe("HighlightModeSchema", () => {
    it.each([
      {
        description: "valid value 'next_three_words'",
        input: "next_three_words",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'letter' | 'word' | 'next_word' | 'next_two_words' | 'next_three_words', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(HighlightModeSchema).toReject(input, expectedError);
      } else {
        expect(HighlightModeSchema).toValidate(input);
      }
    });
  });

  describe("TypedEffectSchema", () => {
    it.each([
      {
        description: "valid value 'dots'",
        input: "dots",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'keep' | 'hide' | 'fade' | 'dots', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TypedEffectSchema).toReject(input, expectedError);
      } else {
        expect(TypedEffectSchema).toValidate(input);
      }
    });
  });

  describe("TapeModeSchema", () => {
    it.each([
      {
        description: "valid value 'word'",
        input: "word",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'letter' | 'word', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TapeModeSchema).toReject(input, expectedError);
      } else {
        expect(TapeModeSchema).toValidate(input);
      }
    });
  });

  describe("TypingSpeedUnitSchema", () => {
    it.each([
      {
        description: "valid value 'wph'",
        input: "wph",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'wpm' | 'cpm' | 'wps' | 'cps' | 'wph', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TypingSpeedUnitSchema).toReject(input, expectedError);
      } else {
        expect(TypingSpeedUnitSchema).toValidate(input);
      }
    });
  });

  describe("AdsSchema", () => {
    it.each([
      {
        description: "valid value 'sellout'",
        input: "sellout",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'result' | 'on' | 'sellout', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(AdsSchema).toReject(input, expectedError);
      } else {
        expect(AdsSchema).toValidate(input);
      }
    });
  });

  describe("MinimumAccuracySchema", () => {
    it.each([
      {
        description: "valid value 'custom'",
        input: "custom",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'custom', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(MinimumAccuracySchema).toReject(input, expectedError);
      } else {
        expect(MinimumAccuracySchema).toValidate(input);
      }
    });
  });

  describe("RepeatQuotesSchema", () => {
    it.each([
      {
        description: "valid value 'typing'",
        input: "typing",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'typing', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(RepeatQuotesSchema).toReject(input, expectedError);
      } else {
        expect(RepeatQuotesSchema).toValidate(input);
      }
    });
  });

  describe("OppositeShiftModeSchema", () => {
    it.each([
      {
        description: "valid value 'keymap'",
        input: "keymap",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'on' | 'keymap', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(OppositeShiftModeSchema).toReject(input, expectedError);
      } else {
        expect(OppositeShiftModeSchema).toValidate(input);
      }
    });
  });

  describe("CustomBackgroundSizeSchema", () => {
    it.each([
      {
        description: "valid value 'cover'",
        input: "cover",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'cover' | 'contain' | 'max', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CustomBackgroundSizeSchema).toReject(input, expectedError);
      } else {
        expect(CustomBackgroundSizeSchema).toValidate(input);
      }
    });
  });

  describe("MonkeyPowerLevelSchema", () => {
    it.each([
      {
        description: "valid value '3'",
        input: "3",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | '1' | '2' | '3' | '4', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(MonkeyPowerLevelSchema).toReject(input, expectedError);
      } else {
        expect(MonkeyPowerLevelSchema).toValidate(input);
      }
    });
  });

  describe("MinimumBurstSchema", () => {
    it.each([
      {
        description: "valid value 'fixed'",
        input: "fixed",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'fixed' | 'flex', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(MinimumBurstSchema).toReject(input, expectedError);
      } else {
        expect(MinimumBurstSchema).toValidate(input);
      }
    });
  });

  describe("ShowAverageSchema", () => {
    it.each([
      {
        description: "valid value 'speed'",
        input: "speed",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | 'speed' | 'acc' | 'both', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ShowAverageSchema).toReject(input, expectedError);
      } else {
        expect(ShowAverageSchema).toValidate(input);
      }
    });
  });

  describe("FunboxNameSchema", () => {
    it.each([
      {
        description: "valid value 'mirror'",
        input: "mirror",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected '58008' | 'mirror' | 'upside_down' | 'nausea' | 'round_round_baby' | 'simon_says' | 'tts' | 'choo_choo' | 'arrows' | 'rAnDoMcAsE' | 'sPoNgEcAsE' | 'capitals' | 'layout_mirror' | 'layoutfluid' | 'earthquake' | 'space_balls' | 'gibberish' | 'ascii' | 'specials' | 'plus_zero' | 'plus_one' | 'plus_two' | 'plus_three' | 'read_ahead_easy' | 'read_ahead' | 'read_ahead_hard' | 'memory' | 'nospace' | 'poetry' | 'wikipedia' | 'weakspot' | 'pseudolang' | 'IPv4' | 'IPv6' | 'binary' | 'hexadecimal' | 'zipf' | 'morse' | 'crt' | 'backwards' | 'ddoouubblleedd' | 'instant_messaging' | 'underscore_spaces' | 'ALL_CAPS' | 'polyglot' | 'asl' | 'rot13' | 'no_quit', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(FunboxNameSchema).toReject(input, expectedError);
      } else {
        expect(FunboxNameSchema).toValidate(input);
      }
    });
  });

  describe("PlayTimeWarningSchema", () => {
    it.each([
      {
        description: "valid value '5'",
        input: "5",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'off' | '1' | '3' | '5' | '10', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PlayTimeWarningSchema).toReject(input, expectedError);
      } else {
        expect(PlayTimeWarningSchema).toValidate(input);
      }
    });
  });

  describe("ConfigGroupNameSchema", () => {
    it.each([
      {
        description: "valid value 'appearance'",
        input: "appearance",
      },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'test' | 'behavior' | 'input' | 'sound' | 'caret' | 'appearance' | 'theme' | 'hideElements' | 'hidden' | 'ads', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ConfigGroupNameSchema).toReject(input, expectedError);
      } else {
        expect(ConfigGroupNameSchema).toValidate(input);
      }
    });
  });

  describe("CustomBackgroundSchema", () => {
    it.each([
      {
        description: "http",
        input: `http://example.com/path/image.png`,
      },
      {
        description: "https",
        input: `https://example.com/path/image.png`,
      },
      {
        description: "png",
        input: `https://example.com/path/image.png`,
      },
      {
        description: "gif",
        input: `https://example.com/path/image.gif?width=5`,
      },
      {
        description: "jpeg",
        input: `https://example.com/path/image.jpeg`,
      },
      {
        description: "jpg",
        input: `https://example.com/path/image.jpg`,
      },
      {
        description: "tiff",
        input: `https://example.com/path/image.tiff`,
        expectedError: "Unsupported image format",
      },
      {
        description: "non-url",
        input: `test`,
        expectedError: "Needs to be an URI",
      },
      {
        description: "single quotes",
        input: `https://example.com/404.jpg?q=alert('1')`,
        expectedError: "May not contain quotes",
      },
      {
        description: "double quotes",
        input: `https://example.com/404.jpg?q=alert("1")`,
        expectedError: "May not contain quotes",
      },
      {
        description: "back tick",
        input: `https://example.com/404.jpg?q=alert(\`1\`)`,
        expectedError: "May not contain quotes",
      },
      {
        description: "javascript url",
        input: `javascript:alert('asdf');//https://example.com/img.jpg`,
        expectedError: "Unsupported protocol",
      },
      {
        description: "data url",
        input: `data:image/gif;base64,data`,
        expectedError: "Unsupported protocol",
      },
      {
        description: "long url",
        input: `https://example.com/path/image.jpeg?q=${new Array(2048)
          .fill("x")
          .join()}`,
        expectedError: "URL is too long",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CustomBackgroundSchema).toReject(input, expectedError);
      } else {
        expect(CustomBackgroundSchema).toValidate(input);
      }
    });
  });
});
