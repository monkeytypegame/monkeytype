import { checkCompatibility } from "@monkeytype/funbox";
import * as DB from "./db";
import * as Notifications from "./elements/notifications";
import { isAuthenticated } from "./firebase";
import { canSetFunboxWithConfig } from "./test/funbox/funbox-validation";
import { isDevEnvironment, reloadAfter } from "./utils/misc";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { roundTo1 } from "@monkeytype/util/numbers";
import { capitalizeFirstLetter } from "./utils/strings";
import { getDefaultConfig } from "./constants/default-config";
// type SetBlock = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K][];
// };

// type RequiredConfig = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K];
// };

export type ConfigMetadata<K extends keyof ConfigSchemas.Config> = {
  /**
   * Optional display string for the config key.
   */
  displayString?: string;
  /**
   * Should the config change trigger a resize event? handled in ui.ts:108
   */
  triggerResize?: true;

  /**
   * Icon to display in the commandline and settings
   */
  icon: string;

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
    icon: "fa-at",
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
    icon: "fa-hashtag",
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
    icon: "fa-font",
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
    icon: "fa-clock",
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
    icon: "fa-bars",
    changeRequiresRestart: true,
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
        Notifications.add(`Pace caret will not work with zen mode.`, 0);
      }
    },
  },
  quoteLength: {
    icon: "fa-quote-right",
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
    icon: "fa-language",
    displayString: "language",
    changeRequiresRestart: true,
    group: "test",
  },
  burstHeatmap: {
    icon: "fa-fire",
    displayString: "word burst heatmap",
    changeRequiresRestart: false,
    group: "test",
  },

  // behavior
  difficulty: {
    icon: "fa-star",
    changeRequiresRestart: true,
    group: "behavior",
  },
  quickRestart: {
    icon: "fa-redo-alt",
    displayString: "quick restart",
    changeRequiresRestart: false,
    group: "behavior",
  },
  repeatQuotes: {
    icon: "fa-sync-alt",
    displayString: "repeat quotes",
    changeRequiresRestart: false,
    group: "behavior",
  },
  resultSaving: {
    icon: "fa-save",
    displayString: "result saving",
    changeRequiresRestart: false,
    group: "behavior",
  },
  blindMode: {
    icon: "fa-eye-slash",
    displayString: "blind mode",
    changeRequiresRestart: false,
    group: "behavior",
  },
  alwaysShowWordsHistory: {
    icon: "fa-align-left",
    displayString: "always show words history",
    changeRequiresRestart: false,
    group: "behavior",
  },
  singleListCommandLine: {
    icon: "fa-list",
    displayString: "single list command line",
    changeRequiresRestart: false,
    group: "behavior",
  },
  minWpm: {
    icon: "fa-bomb",
    displayString: "min speed",
    changeRequiresRestart: true,
    group: "behavior",
  },
  minWpmCustomSpeed: {
    icon: "fa-bomb",
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
    icon: "fa-bomb",
    displayString: "min accuracy",
    changeRequiresRestart: true,
    group: "behavior",
  },
  minAccCustom: {
    icon: "fa-bomb",
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
    icon: "fa-bomb",
    displayString: "min word burst",
    changeRequiresRestart: true,
    group: "behavior",
  },
  minBurstCustomSpeed: {
    icon: "fa-bomb",
    displayString: "min word burst custom speed",
    changeRequiresRestart: true,
    group: "behavior",
  },
  britishEnglish: {
    icon: "fa-language",
    displayString: "british english",
    changeRequiresRestart: true,
    group: "behavior",
  },
  funbox: {
    icon: "fa-gamepad",
    changeRequiresRestart: true,
    group: "behavior",
    isBlocked: ({ value, currentConfig }) => {
      if (!checkCompatibility(value)) {
        Notifications.add(
          `${capitalizeFirstLetter(
            value.join(", "),
          )} is an invalid combination of funboxes`,
          0,
        );
        return true;
      }

      for (const funbox of value) {
        if (!canSetFunboxWithConfig(funbox, currentConfig)) {
          Notifications.add(
            `${value}" cannot be enabled with the current config`,
            0,
          );
          return true;
        }
      }

      return false;
    },
  },
  customLayoutfluid: {
    icon: "fa-tint",
    displayString: "custom layoutfluid",
    changeRequiresRestart: true,
    group: "behavior",
    overrideValue: ({ value }) => {
      return Array.from(new Set(value));
    },
  },
  customPolyglot: {
    icon: "fa-language",
    displayString: "custom polyglot",
    changeRequiresRestart: false,
    group: "behavior",
    overrideValue: ({ value }) => {
      return Array.from(new Set(value));
    },
  },

  // input
  freedomMode: {
    icon: "fa-feather-alt",
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
    icon: "fa-minus",
    displayString: "strict space",
    changeRequiresRestart: true,
    group: "input",
  },
  oppositeShiftMode: {
    icon: "fa-exchange-alt",
    displayString: "opposite shift mode",
    changeRequiresRestart: false,
    group: "input",
  },
  stopOnError: {
    icon: "fa-hand-paper",
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
    icon: "fa-backspace",
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
    icon: "fa-step-forward",
    displayString: "quick end",
    changeRequiresRestart: false,
    group: "input",
  },
  indicateTypos: {
    icon: "fa-exclamation",
    displayString: "indicate typos",
    changeRequiresRestart: false,
    group: "input",
  },
  compositionDisplay: {
    icon: "fa-language",
    displayString: "composition display",
    changeRequiresRestart: false,
    group: "input",
  },
  hideExtraLetters: {
    icon: "fa-eye-slash",
    displayString: "hide extra letters",
    changeRequiresRestart: false,
    group: "input",
  },
  lazyMode: {
    icon: "fa-couch",
    displayString: "lazy mode",
    changeRequiresRestart: true,
    group: "input",
  },
  layout: {
    icon: "fa-keyboard",
    displayString: "layout",
    changeRequiresRestart: true,
    group: "input",
  },
  codeUnindentOnBackspace: {
    icon: "fa-code",
    displayString: "code unindent on backspace",
    changeRequiresRestart: true,
    group: "input",
  },

  // sound
  soundVolume: {
    icon: "fa-volume-down",
    displayString: "sound volume",
    changeRequiresRestart: false,
    group: "sound",
  },
  playSoundOnClick: {
    icon: "fa-volume-up",
    displayString: "play sound on click",
    changeRequiresRestart: false,
    group: "sound",
  },
  playSoundOnError: {
    icon: "fa-volume-mute",
    displayString: "play sound on error",
    changeRequiresRestart: false,
    group: "sound",
  },
  playTimeWarning: {
    icon: "fa-exclamation-triangle",
    displayString: "play time warning",
    changeRequiresRestart: false,
    group: "sound",
  },

  // caret
  smoothCaret: {
    icon: "fa-i-cursor",
    displayString: "smooth caret",
    changeRequiresRestart: false,
    group: "caret",
  },
  caretStyle: {
    icon: "fa-i-cursor",
    displayString: "caret style",
    changeRequiresRestart: false,
    group: "caret",
  },
  paceCaret: {
    icon: "fa-i-cursor",
    displayString: "pace caret",
    changeRequiresRestart: false,
    group: "caret",
    isBlocked: ({ value }) => {
      if (document.readyState === "complete") {
        if ((value === "pb" || value === "tagPb") && !isAuthenticated()) {
          Notifications.add(
            `Pace caret "pb" and "tag pb" are unavailable without an account`,
            0,
          );
          return true;
        }
      }
      return false;
    },
  },
  paceCaretCustomSpeed: {
    icon: "fa-i-cursor",
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
    icon: "fa-i-cursor",
    displayString: "pace caret style",
    changeRequiresRestart: false,
    group: "caret",
  },
  repeatedPace: {
    icon: "fa-i-cursor",
    displayString: "repeated pace",
    changeRequiresRestart: false,
    group: "caret",
  },

  // appearance
  timerStyle: {
    icon: "fa-chart-pie",
    displayString: "live progress style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  liveSpeedStyle: {
    icon: "fa-tachometer-alt",
    displayString: "live speed style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  liveAccStyle: {
    icon: "fa-tachometer-alt",
    displayString: "live accuracy style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  liveBurstStyle: {
    icon: "fa-tachometer-alt",
    displayString: "live word burst style",
    changeRequiresRestart: false,
    group: "appearance",
  },
  timerColor: {
    icon: "fa-chart-pie",
    displayString: "timer color",
    changeRequiresRestart: false,
    group: "appearance",
  },
  timerOpacity: {
    icon: "fa-chart-pie",
    displayString: "timer opacity",
    changeRequiresRestart: false,
    group: "appearance",
  },
  highlightMode: {
    icon: "fa-highlighter",
    displayString: "highlight mode",
    changeRequiresRestart: false,
    group: "appearance",
  },
  typedEffect: {
    icon: "fa-eye",
    displayString: "typed effect",
    changeRequiresRestart: false,
    group: "appearance",
  },
  tapeMode: {
    icon: "fa-tape",
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
    icon: "fa-tape",
    displayString: "tape margin",
    triggerResize: true,
    changeRequiresRestart: false,
    group: "appearance",
  },
  smoothLineScroll: {
    icon: "fa-align-left",
    displayString: "smooth line scroll",
    changeRequiresRestart: false,
    group: "appearance",
  },
  showAllLines: {
    icon: "fa-align-left",
    changeRequiresRestart: false,
    displayString: "show all lines",
    group: "appearance",
    isBlocked: ({ value, currentConfig }) => {
      if (value && currentConfig.tapeMode !== "off") {
        Notifications.add("Show all lines doesn't support tape mode.", 0);
        return true;
      }
      return false;
    },
  },
  alwaysShowDecimalPlaces: {
    icon: "00",
    displayString: "always show decimal places",
    changeRequiresRestart: false,
    group: "appearance",
  },
  typingSpeedUnit: {
    icon: "fa-tachometer-alt",
    displayString: "typing speed unit",
    changeRequiresRestart: false,
    group: "appearance",
  },
  startGraphsAtZero: {
    icon: "fa-chart-line",
    displayString: "start graphs at zero",
    changeRequiresRestart: false,
    group: "appearance",
  },
  maxLineWidth: {
    icon: "fa-text-width",
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "max line width",
    group: "appearance",
  },
  fontSize: {
    icon: "fa-font",
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "font size",
    group: "appearance",
  },
  fontFamily: {
    icon: "fa-font",
    displayString: "font family",
    changeRequiresRestart: false,
    group: "appearance",
  },
  keymapMode: {
    icon: "fa-keyboard",
    displayString: "keymap mode",
    changeRequiresRestart: false,
    group: "appearance",
  },
  keymapLayout: {
    icon: "fa-keyboard",
    displayString: "keymap layout",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapStyle: {
    icon: "fa-keyboard",
    displayString: "keymap style",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapLegendStyle: {
    icon: "fa-keyboard",
    displayString: "keymap legend style",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapShowTopRow: {
    icon: "fa-keyboard",
    displayString: "keymap show top row",
    changeRequiresRestart: false,
    group: "appearance",
    overrideConfig: ({ currentConfig }) =>
      currentConfig.keymapMode === "off" ? { keymapMode: "static" } : {},
  },
  keymapSize: {
    icon: "fa-keyboard",
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
    icon: "fa-adjust",
    displayString: "flip test colors",
    changeRequiresRestart: false,
    group: "theme",
  },
  colorfulMode: {
    icon: "fa-fill-drip",
    displayString: "colorful mode",
    changeRequiresRestart: false,
    group: "theme",
  },
  customBackground: {
    icon: "fa-link",
    displayString: "URL background",
    changeRequiresRestart: false,
    group: "theme",
    overrideValue: ({ value }) => {
      return value.trim();
    },
  },
  customBackgroundSize: {
    icon: "fa-image",
    displayString: "custom background size",
    changeRequiresRestart: false,
    group: "theme",
  },
  customBackgroundFilter: {
    icon: "fa-image",
    displayString: "custom background filter",
    changeRequiresRestart: false,
    group: "theme",
  },
  autoSwitchTheme: {
    icon: "fa-palette",
    displayString: "auto switch theme",
    changeRequiresRestart: false,
    group: "theme",
  },
  themeLight: {
    icon: "fa-palette",
    displayString: "theme light",
    changeRequiresRestart: false,
    group: "theme",
  },
  themeDark: {
    icon: "fa-palette",
    displayString: "theme dark",
    changeRequiresRestart: false,
    group: "theme",
  },
  randomTheme: {
    icon: "fa-palette",
    changeRequiresRestart: false,
    displayString: "random theme",
    group: "theme",
    isBlocked: ({ value }) => {
      if (value === "custom") {
        const snapshot = DB.getSnapshot();
        if (!isAuthenticated()) {
          Notifications.add(
            "Random theme 'custom' is unavailable without an account",
            0,
          );
          return true;
        }
        if (!snapshot) {
          Notifications.add(
            "Random theme 'custom' requires a snapshot to be set",
            0,
          );
          return true;
        }
        if (snapshot?.customThemes?.length === 0) {
          Notifications.add(
            "Random theme 'custom' requires at least one custom theme to be saved",
            0,
          );
          return true;
        }
      }
      return false;
    },
  },
  favThemes: {
    icon: "fa-palette",
    displayString: "favorite themes",
    changeRequiresRestart: false,
    group: "theme",
  },
  theme: {
    icon: "fa-palette",
    changeRequiresRestart: false,
    group: "theme",
    overrideConfig: () => {
      return {
        customTheme: false,
      };
    },
  },
  customTheme: {
    icon: "fa-palette",
    displayString: "custom theme",
    changeRequiresRestart: false,
    group: "theme",
  },
  customThemeColors: {
    icon: "fa-palette",
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
    icon: "fa-question",
    displayString: "show key tips",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  showOutOfFocusWarning: {
    icon: "fa-exclamation",
    displayString: "show out of focus warning",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  capsLockWarning: {
    icon: "fa-exclamation-triangle",
    displayString: "caps lock warning",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  showAverage: {
    icon: "fa-chart-bar",
    displayString: "show average",
    changeRequiresRestart: false,
    group: "hideElements",
  },
  showPb: {
    icon: "fa-crown",
    displayString: "show personal best",
    changeRequiresRestart: false,
    group: "hideElements",
  },

  // other (hidden)
  accountChart: {
    icon: "fa-chart-line",
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
    icon: "fa-egg",
    displayString: "monkey",
    changeRequiresRestart: false,
    group: "hidden",
  },
  monkeyPowerLevel: {
    icon: "fa-egg",
    displayString: "monkey power level",
    changeRequiresRestart: false,
    group: "hidden",
  },

  // ads
  ads: {
    icon: "fa-ad",
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
        Notifications.add("Ads are disabled in development mode.", 0);
        return true;
      }
      return false;
    },
    afterSet: ({ nosave }) => {
      if (!nosave && !isDevEnvironment()) {
        reloadAfter(3);
        Notifications.add("Ad settings changed. Refreshing...", 0);
      }
    },
  },
};
