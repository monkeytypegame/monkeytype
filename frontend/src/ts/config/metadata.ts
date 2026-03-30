import { checkCompatibility } from "@monkeytype/funbox";
import * as DB from "../db";
import { showNoticeNotification } from "../states/notifications";
import { isAuthenticated } from "../states/core";
import { canSetFunboxWithConfig } from "./funbox-validation";
import { reloadAfter } from "../utils/misc";
import { isDevEnvironment } from "../utils/env";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { roundTo1 } from "@monkeytype/util/numbers";
import { capitalizeFirstLetter } from "../utils/strings";
import { getDefaultConfig } from "../constants/default-config";
import { FaObject } from "../types/font-awesome";
// type SetBlock = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K][];
// };

// type RequiredConfig = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K];
// };

export type ConfigMetadata<K extends keyof ConfigSchemas.Config> = {
  /**
   * The config key that this metadata is for
   */
  key: K;

  /**
   * Optional display string for the config key.
   */
  displayString?: string;
  /**
   * Should the config change trigger a resize event? handled in ui.ts:108
   */
  triggerResize?: true;

  /**
   * Fa object (icon)
   */
  fa: FaObject;

  optionsMetadata?: ConfigSchemas.Config[K] extends string | number | symbol
    ? Partial<
        Record<
          ConfigSchemas.Config[K],
          {
            displayString?: string;
            fa?: FaObject;
          }
        >
      >
    : never;

  // commandline?: {
  //   displayValues?: ConfigSchemas.Config[K] extends string | number | symbol
  //     ? Partial<Record<ConfigSchemas.Config[K], string>>
  //     : never;
  // };

  /**
   * Group that this config belongs to. Used for partial presets
   */
  group: ConfigSchemas.ConfigGroupName;

  /**
   * Is a test restart required after this config change?
   */
  changeRequiresRestart: boolean;
  /**
   * Optional function that checks if the config value is blocked from being set.
   * Returns true if setting the config value should be blocked.
   * @param options - The options object containing the value being set and the current config.
   */
  isBlocked?: (options: {
    value: ConfigSchemas.Config[K];
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => boolean;
  /**
   * Optional function to override the value before setting it.
   * Returns the modified value.
   * @param options - The options object containing the value being set, the current value, and the current config.
   * @returns The modified value to be set for the config key.
   */
  overrideValue?: (options: {
    value: ConfigSchemas.Config[K];
    currentValue: ConfigSchemas.Config[K];
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => ConfigSchemas.Config[K];
  /**
   * Optional function to override other config values before this one is set.
   * Returns an object with the config keys and their new values.
   * @param options - The options object containing the value being set and the current config.
   */
  overrideConfig?: (options: {
    value: ConfigSchemas.Config[K];
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => Partial<ConfigSchemas.Config>;
  /**
   * Optional function that is called after the config value is set.
   * It can be used to perform additional actions, like reloading the page.
   * @param options - The options object containing the nosave flag and the current config.
   */
  afterSet?: (options: {
    nosave: boolean;
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => void;
};

export type ConfigMetadataObject = {
  [K in keyof ConfigSchemas.Config]: ConfigMetadata<K>;
};

//todo:
// maybe have generic set somehow handle test restarting

export const configMetadata: ConfigMetadataObject = {
  // test
  punctuation: {
    key: "punctuation",
    fa: {
      icon: "fa-at",
    },
    changeRequiresRestart: true,
    group: "test",
    overrideValue: ({ value, currentConfig }) => {
      if (currentConfig.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  numbers: {
    key: "numbers",
    fa: {
      icon: "fa-hashtag",
    },
    changeRequiresRestart: true,
    group: "test",
    overrideValue: ({ value, currentConfig }) => {
      if (currentConfig.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  words: {
    key: "words",
    fa: { icon: "fa-font" },
    displayString: "word count",
    changeRequiresRestart: true,
    group: "test",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.mode !== "words") {
        return {
          mode: "words",
        };
      }
      return {};
    },
  },
  time: {
    key: "time",
    fa: { icon: "fa-clock" },
    changeRequiresRestart: true,
    displayString: "time",
    group: "test",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.mode !== "time") {
        return {
          mode: "time",
        };
      }
      return {};
    },
  },
  mode: {
    key: "mode",
    fa: { icon: "fa-bars" },
    changeRequiresRestart: true,
    optionsMetadata: {
      time: {
        fa: { icon: "fa-clock" },
      },
      words: {
        fa: { icon: "fa-font" },
      },
      quote: {
        fa: { icon: "fa-quote-left" },
      },
      zen: {
        fa: { icon: "fa-mountain" },
      },
      custom: {
        fa: { icon: "fa-wrench" },
      },
    },
    group: "test",
    overrideConfig: ({ value }) => {
      if (value === "custom" || value === "quote" || value === "zen") {
        return {
          numbers: false,
          punctuation: false,
        };
      }
      return {};
    },
    afterSet: ({ currentConfig }) => {
      if (currentConfig.mode === "zen" && currentConfig.paceCaret !== "off") {
        showNoticeNotification(`Pace caret will not work with zen mode.`);
      }
    },
  },
  quoteLength: {
    key: "quoteLength",
    fa: { icon: "fa-quote-right" },
    displayString: "quote length",
    changeRequiresRestart: true,
    group: "test",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.mode !== "quote") {
        return {
          mode: "quote",
        };
      }
      return {};
    },
  },
  language: {
    key: "language",
    fa: { icon: "fa-language" },
    displayString: "language",
    changeRequiresRestart: true,
    group: "test",
  },
  burstHeatmap: {
    key: "burstHeatmap",
    fa: { icon: "fa-fire" },
    displayString: "word burst heatmap",
    changeRequiresRestart: false,
    group: "test",
  },

  // behavior
  difficulty: {
    key: "difficulty",
    fa: { icon: "fa-star" },
    changeRequiresRestart: true,
    group: "behavior",
  },
  quickRestart: {
    key: "quickRestart",
    fa: { icon: "fa-redo-alt" },
    displayString: "quick restart",
    changeRequiresRestart: false,
    group: "behavior",
  },
  repeatQuotes: {
    key: "repeatQuotes",
    fa: { icon: "fa-sync-alt" },
    displayString: "repeat quotes",
    changeRequiresRestart: false,
    group: "behavior",
  },
  resultSaving: {
    key: "resultSaving",
    fa: { icon: "fa-save" },
    displayString: "result saving",
    changeRequiresRestart: false,
    group: "behavior",
  },
  blindMode: {
    key: "blindMode",
    fa: { icon: "fa-eye-slash" },
    displayString: "blind mode",
    changeRequiresRestart: false,
    group: "behavior",
  },
  alwaysShowWordsHistory: {
    key: "alwaysShowWordsHistory",
    fa: { icon: "fa-align-left" },
    displayString: "always show words history",
    changeRequiresRestart: false,
    group: "behavior",
  },
  singleListCommandLine: {
    key: "singleListCommandLine",
    fa: { icon: "fa-list" },
    displayString: "single list command line",
    changeRequiresRestart: false,
    group: "behavior",
  },
  minWpm: {
    key: "minWpm",
    fa: { icon: "fa-bomb" },
    displayString: "min speed",
    changeRequiresRestart: true,
    group: "behavior",
  },
  minWpmCustomSpeed: {
    key: "minWpmCustomSpeed",
    fa: { icon: "fa-bomb" },
    displayString: "min speed custom",
    changeRequiresRestart: true,
    group: "behavior",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.minWpm !== "custom") {
        return {
          minWpm: "custom",
        };
      }
      return {};
    },
  },
  minAcc: {
    key: "minAcc",
    fa: { icon: "fa-bomb" },
    displayString: "min accuracy",
    changeRequiresRestart: true,
    group: "behavior",
  },
  minAccCustom: {
    key: "minAccCustom",
    fa: { icon: "fa-bomb" },
    displayString: "min accuracy custom",
    changeRequiresRestart: true,
    group: "behavior",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.minAcc !== "custom") {
        return {
          minAcc: "custom",
        };
      }
      return {};
    },
  },
  minBurst: {
    key: "minBurst",
    fa: { icon: "fa-bomb" },
    displayString: "min word burst",
    changeRequiresRestart: true,
    group: "behavior",
  },
  minBurstCustomSpeed: {
    key: "minBurstCustomSpeed",
    fa: { icon: "fa-bomb" },
    displayString: "min word burst custom speed",
    changeRequiresRestart: true,
    group: "behavior",
  },
  britishEnglish: {
    key: "britishEnglish",
    fa: { icon: "fa-language" },
    displayString: "british english",
    changeRequiresRestart: true,
    group: "behavior",
  },
  funbox: {
    key: "funbox",
    fa: { icon: "fa-gamepad" },
    changeRequiresRestart: true,
    group: "behavior",
    isBlocked: ({ value, currentConfig }) => {
      if (!checkCompatibility(value)) {
        showNoticeNotification(
          `${capitalizeFirstLetter(
            value.join(", "),
          )} is an invalid combination of funboxes`,
        );
        return true;
      }

      for (const funbox of value) {
        const check = canSetFunboxWithConfig(funbox, currentConfig);
        if (!check.ok) {
          showNoticeNotification(
            `"${funbox}" cannot be enabled with the current config`,
          );
          return true;
        }
      }

      return false;
    },
  },
  customLayoutfluid: {
    key: "customLayoutfluid",
    fa: { icon: "fa-tint" },
    displayString: "custom layoutfluid",
    changeRequiresRestart: true,
    group: "behavior",
    overrideValue: ({ value }) => {
      return Array.from(new Set(value));
    },
  },
  customPolyglot: {
    key: "customPolyglot",
    fa: { icon: "fa-language" },
    displayString: "custom polyglot",
    changeRequiresRestart: false,
    group: "behavior",
    overrideValue: ({ value }) => {
      return Array.from(new Set(value));
    },
  },

  // input
  freedomMode: {
    key: "freedomMode",
    fa: { icon: "fa-feather-alt" },
    changeRequiresRestart: false,
    displayString: "freedom mode",
    group: "input",
    overrideConfig: ({ value }) => {
      if (value) {
        return {
          confidenceMode: "off",
        };
      }
      return {};
    },
  },
  strictSpace: {
    key: "strictSpace",
    fa: { icon: "fa-minus" },
    displayString: "strict space",
    changeRequiresRestart: true,
    group: "input",
  },
  oppositeShiftMode: {
    key: "oppositeShiftMode",
    fa: { icon: "fa-exchange-alt" },
    displayString: "opposite shift mode",
    changeRequiresRestart: false,
    group: "input",
  },
  stopOnError: {
    key: "stopOnError",
    fa: { icon: "fa-hand-paper" },
    displayString: "stop on error",
    changeRequiresRestart: true,
    group: "input",
    overrideConfig: ({ value }) => {
      if (value !== "off") {
        return {
          confidenceMode: "off",
        };
      }
      return {};
    },
  },
  confidenceMode: {
    key: "confidenceMode",
    fa: { icon: "fa-backspace" },
    displayString: "confidence mode",
    changeRequiresRestart: false,
    group: "input",
    overrideConfig: ({ value }) => {
      if (value !== "off") {
        return {
          freedomMode: false,
          stopOnError: "off",
        };
      }
      return {};
    },
  },
  quickEnd: {
    key: "quickEnd",
    fa: { icon: "fa-step-forward" },
    displayString: "quick end",
    changeRequiresRestart: false,
    group: "input",
  },
  indicateTypos: {
    key: "indicateTypos",
    fa: { icon: "fa-exclamation" },
    displayString: "indicate typos",
    changeRequiresRestart: false,
    group: "input",
  },
  compositionDisplay: {
    key: "compositionDisplay",
    fa: { icon: "fa-language" },
    displayString: "composition display",
    changeRequiresRestart: false,
    group: "input",
  },
  hideExtraLetters: {
    key: "hideExtraLetters",
    fa: { icon: "fa-eye-slash" },
    displayString: "hide extra letters",
    changeRequiresRestart: false,
    group: "input",
  },
  lazyMode: {
    key: "lazyMode",
    fa: { icon: "fa-couch" },
    displayString: "lazy mode",
    changeRequiresRestart: true,
    group: "input",
  },
  layout: {
    key: "layout",
    fa: { icon: "fa-keyboard" },
    displayString: "layout",
    changeRequiresRestart: true,
    group: "input",
  },
  codeUnindentOnBackspace: {
    key: "codeUnindentOnBackspace",
    fa: { icon: "fa-code" },
    displayString: "code unindent on backspace",
    changeRequiresRestart: true,
    group: "input",
  },

  // sound
  soundVolume: {
    key: "soundVolume",
    fa: { icon: "fa-volume-down" },
    displayString: "sound volume",
    changeRequiresRestart: false,
    group: "sound",
  },
  playSoundOnClick: {
    key: "playSoundOnClick",
    fa: { icon: "fa-volume-up" },
    displayString: "play sound on click",
    changeRequiresRestart: false,
    group: "sound",
  },
  playSoundOnError: {
    key: "playSoundOnError",
    fa: { icon: "fa-volume-mute" },
    displayString: "play sound on error",
    changeRequiresRestart: false,
    group: "sound",
  },
  playTimeWarning: {
    key: "playTimeWarning",
    fa: { icon: "fa-exclamation-triangle" },
    displayString: "play time warning",
    changeRequiresRestart: false,
    group: "sound",
  },

  // caret
  smoothCaret: {
    key: "smoothCaret",
    fa: { icon: "fa-i-cursor" },
    displayString: "smooth caret",
    changeRequiresRestart: false,
    group: "caret",
  },
  caretStyle: {
    key: "caretStyle",
    fa: { icon: "fa-i-cursor" },
    displayString: "caret style",
    changeRequiresRestart: false,
    group: "caret",
  },
  paceCaret: {
    key: "paceCaret",
    fa: { icon: "fa-i-cursor" },
    displayString: "pace caret",
    changeRequiresRestart: false,
    group: "caret",
    isBlocked: ({ value }) => {
      if (document.readyState === "complete") {
        if ((value === "pb" || value === "tagPb") && !isAuthenticated()) {
          showNoticeNotification(
            `Pace caret "pb" and "tag pb" are unavailable without an account`,
          );
          return true;
        }
      }
      return false;
    },
  },
  paceCaretCustomSpeed: {
    key: "paceCaretCustomSpeed",
    fa: { icon: "fa-i-cursor" },
    displayString: "pace caret custom speed",
    changeRequiresRestart: false,
    group: "caret",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.paceCaret !== "custom") {
        return {
          paceCaret: "custom",
        };
      }
      return {};
    },
  },
  paceCaretStyle: {
    key: "paceCaretStyle",
    fa: { icon: "fa-i-cursor" },
    displayString: "pace caret style",
    changeRequiresRestart: false,
    group: "caret",
  },
  repeatedPace: {
    key: "repeatedPace",
    fa: { icon: "fa-i-cursor" },
    displayString: "repeated pace",
    changeRequiresRestart: false,
    group: "caret",
  },

  // appearance
  timerStyle: {
    key: "timerStyle",
    fa: { icon: "fa-chart-pie" },
    displayString: "live progress style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  liveSpeedStyle: {
    key: "liveSpeedStyle",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "live speed style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  liveAccStyle: {
    key: "liveAccStyle",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "live accuracy style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  liveBurstStyle: {
    key: "liveBurstStyle",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "live word burst style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  timerColor: {
    key: "timerColor",
    fa: { icon: "fa-chart-pie" },
    displayString: "timer color",
    changeRequiresRestart: false,
    group: "appearance",
  },
  timerOpacity: {
    key: "timerOpacity",
    fa: { icon: "fa-chart-pie" },
    displayString: "timer opacity",
    changeRequiresRestart: false,
    group: "appearance",
  },
  highlightMode: {
    key: "highlightMode",
    fa: { icon: "fa-highlighter" },
    displayString: "highlight mode",
    changeRequiresRestart: false,
    group: "appearance",
  },
  typedEffect: {
    key: "typedEffect",
    fa: { icon: "fa-eye" },
    displayString: "typed effect",
    changeRequiresRestart: false,
    group: "appearance",
  },
  tapeMode: {
    key: "tapeMode",
    fa: { icon: "fa-tape" },
    triggerResize: true,
    changeRequiresRestart: false,
    displayString: "tape mode",
    group: "appearance",
    overrideConfig: ({ value }) => {
      if (value !== "off") {
        return {
          showAllLines: false,
        };
      }
      return {};
    },
  },
  tapeMargin: {
    key: "tapeMargin",
    fa: { icon: "fa-tape" },
    displayString: "tape margin",
    triggerResize: true,
    changeRequiresRestart: false,
    group: "appearance",
  },
  smoothLineScroll: {
    key: "smoothLineScroll",
    fa: { icon: "fa-align-left" },
    displayString: "smooth line scroll",
    changeRequiresRestart: false,
    group: "appearance",
  },
  showAllLines: {
    key: "showAllLines",
    fa: { icon: "fa-align-left" },
    changeRequiresRestart: false,
    displayString: "show all lines",
    group: "appearance",
    isBlocked: ({ value, currentConfig }) => {
      if (value && currentConfig.tapeMode !== "off") {
        showNoticeNotification("Show all lines doesn't support tape mode.");
        return true;
      }
      return false;
    },
  },
  alwaysShowDecimalPlaces: {
    key: "alwaysShowDecimalPlaces",
    fa: {
      icon: "fa-ellipsis-h",
    },
    displayString: "always show decimal places",
    changeRequiresRestart: false,
    group: "appearance",
  },
  typingSpeedUnit: {
    key: "typingSpeedUnit",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "typing speed unit",
    changeRequiresRestart: false,
    group: "appearance",
  },
  startGraphsAtZero: {
    key: "startGraphsAtZero",
    fa: { icon: "fa-chart-line" },
    displayString: "start graphs at zero",
    changeRequiresRestart: false,
    group: "appearance",
  },
  maxLineWidth: {
    key: "maxLineWidth",
    fa: { icon: "fa-text-width" },
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "max line width",
    group: "appearance",
  },
  fontSize: {
    key: "fontSize",
    fa: { icon: "fa-font" },
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "font size",
    group: "appearance",
  },
  fontFamily: {
    key: "fontFamily",
    fa: { icon: "fa-font" },
    displayString: "font family",
    changeRequiresRestart: false,
    group: "appearance",
  },
  keymapMode: {
    key: "keymapMode",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap mode",
    changeRequiresRestart: false,
    group: "appearance",
  },
  keymapLayout: {
    key: "keymapLayout",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap layout",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapStyle: {
    key: "keymapStyle",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap style",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapLegendStyle: {
    key: "keymapLegendStyle",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap legend style",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapShowTopRow: {
    key: "keymapShowTopRow",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap show top row",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapSize: {
    key: "keymapSize",
    fa: { icon: "fa-keyboard" },
    triggerResize: true,
    changeRequiresRestart: false,
    displayString: "keymap size",
    group: "appearance",
    overrideValue: ({ value }) => {
      if (value < 0.5) value = 0.5;
      if (value > 3.5) value = 3.5;
      return roundTo1(value);
    },
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },

  // theme
  flipTestColors: {
    key: "flipTestColors",
    fa: { icon: "fa-adjust" },
    displayString: "flip test colors",
    changeRequiresRestart: false,
    group: "theme",
  },
  colorfulMode: {
    key: "colorfulMode",
    fa: { icon: "fa-fill-drip" },
    displayString: "colorful mode",
    changeRequiresRestart: false,
    group: "theme",
  },
  customBackground: {
    key: "customBackground",
    fa: { icon: "fa-link" },
    displayString: "URL background",
    changeRequiresRestart: false,
    group: "theme",
    overrideValue: ({ value }) => {
      return value.trim();
    },
  },
  customBackgroundSize: {
    key: "customBackgroundSize",
    fa: { icon: "fa-image" },
    displayString: "custom background size",
    changeRequiresRestart: false,
    group: "theme",
  },
  customBackgroundFilter: {
    key: "customBackgroundFilter",
    fa: { icon: "fa-image" },
    displayString: "custom background filter",
    changeRequiresRestart: false,
    group: "theme",
  },
  autoSwitchTheme: {
    key: "autoSwitchTheme",
    fa: { icon: "fa-palette" },
    displayString: "auto switch theme",
    changeRequiresRestart: false,
    group: "theme",
  },
  themeLight: {
    key: "themeLight",
    fa: { icon: "fa-palette" },
    displayString: "theme light",
    changeRequiresRestart: false,
    group: "theme",
  },
  themeDark: {
    key: "themeDark",
    fa: { icon: "fa-palette" },
    displayString: "theme dark",
    changeRequiresRestart: false,
    group: "theme",
  },
  randomTheme: {
    key: "randomTheme",
    fa: { icon: "fa-palette" },
    changeRequiresRestart: false,
    displayString: "random theme",
    group: "theme",
    isBlocked: ({ value }) => {
      if (value === "custom") {
        const snapshot = DB.getSnapshot();
        if (!isAuthenticated()) {
          showNoticeNotification(
            "Random theme 'custom' is unavailable without an account",
          );
          return true;
        }
        if (!snapshot) {
          showNoticeNotification(
            "Random theme 'custom' requires a snapshot to be set",
          );
          return true;
        }
        if (snapshot?.customThemes?.length === 0) {
          showNoticeNotification(
            "Random theme 'custom' requires at least one custom theme to be saved",
          );
          return true;
        }
      }
      return false;
    },
  },
  favThemes: {
    key: "favThemes",
    fa: { icon: "fa-palette" },
    displayString: "favorite themes",
    changeRequiresRestart: false,
    group: "theme",
  },
  theme: {
    key: "theme",
    fa: { icon: "fa-palette" },
    changeRequiresRestart: false,
    group: "theme",
    overrideConfig: () => {
      return {
        customTheme: false,
      };
    },
  },
  customTheme: {
    key: "customTheme",
    fa: { icon: "fa-palette" },
    displayString: "custom theme",
    changeRequiresRestart: false,
    group: "theme",
  },
  customThemeColors: {
    key: "customThemeColors",
    fa: { icon: "fa-palette" },
    displayString: "custom theme colors",
    changeRequiresRestart: false,
    group: "theme",
    overrideValue: ({ value }) => {
      const allColorsThesame = value.every((color) => color === value[0]);
      if (allColorsThesame) {
        return getDefaultConfig().customThemeColors;
      } else {
        return value;
      }
    },
  },

  // hide elements
  showKeyTips: {
    key: "showKeyTips",
    fa: { icon: "fa-question" },
    displayString: "show key tips",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  showOutOfFocusWarning: {
    key: "showOutOfFocusWarning",
    fa: { icon: "fa-exclamation" },
    displayString: "show out of focus warning",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  capsLockWarning: {
    key: "capsLockWarning",
    fa: { icon: "fa-exclamation-triangle" },
    displayString: "caps lock warning",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  showAverage: {
    key: "showAverage",
    fa: { icon: "fa-chart-bar" },
    displayString: "show average",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  showPb: {
    key: "showPb",
    fa: { icon: "fa-crown" },
    displayString: "show personal best",
    changeRequiresRestart: false,
    group: "hideElements",
  },

  // other (hidden)
  accountChart: {
    key: "accountChart",
    fa: { icon: "fa-chart-line" },
    displayString: "account chart",
    changeRequiresRestart: false,
    group: "hidden",
    overrideValue: ({ value, currentValue }) => {
      // if both speed and accuracy are off, set opposite to on
      // i dedicate this fix to AshesOfAFallen and our 2 collective brain cells
      if (value[0] === "off" && value[1] === "off") {
        const changedIndex = value[0] === currentValue[0] ? 0 : 1;
        value[changedIndex] = "on";
      }
      return value;
    },
  },
  monkey: {
    key: "monkey",
    fa: { icon: "fa-egg" },
    displayString: "monkey",
    changeRequiresRestart: false,
    group: "hidden",
  },
  monkeyPowerLevel: {
    key: "monkeyPowerLevel",
    fa: { icon: "fa-egg" },
    displayString: "monkey power level",
    changeRequiresRestart: false,
    group: "hidden",
  },

  // ads
  ads: {
    key: "ads",
    fa: { icon: "fa-ad" },
    changeRequiresRestart: false,
    group: "ads",
    overrideValue: ({ value }) => {
      if (isDevEnvironment()) {
        return "off";
      }
      return value;
    },
    isBlocked: ({ value }) => {
      if (value !== "off" && isDevEnvironment()) {
        showNoticeNotification("Ads are disabled in development mode.");
        return true;
      }
      return false;
    },
    afterSet: ({ nosave }) => {
      if (!nosave && !isDevEnvironment()) {
        reloadAfter(3);
        showNoticeNotification("Ad settings changed. Refreshing...");
      }
    },
  },
};
