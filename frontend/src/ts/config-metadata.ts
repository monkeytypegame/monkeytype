import * as DB from "./db";
import * as Notifications from "./elements/notifications";
import { isAuthenticated } from "./firebase";
import { canSetFunboxWithConfig } from "./test/funbox/funbox-validation";
import { isDevEnvironment, reloadAfter } from "./utils/misc";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { roundTo1 } from "@monkeytype/util/numbers";

// type SetBlock = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K][];
// };

// type RequiredConfig = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K];
// };

export type ConfigMetadata = {
  [K in keyof ConfigSchemas.Config]: {
    /**
     * Optional display string for the config key.
     */
    displayString?: string;
    /**
     * Should the config change trigger a resize event? handled in ui.ts:108
     */
    triggerResize?: true;

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
};

//todo:
// maybe have generic set somehow handle test restarting
// maybe add config group to each metadata object? all though its already defined in ConfigGroupsLiteral

export const configMetadata: ConfigMetadata = {
  // test
  punctuation: {
    changeRequiresRestart: true,
    overrideValue: ({ value, currentConfig }) => {
      if (currentConfig.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  numbers: {
    changeRequiresRestart: true,
    overrideValue: ({ value, currentConfig }) => {
      if (currentConfig.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  words: {
    displayString: "word count",
    changeRequiresRestart: true,
  },
  time: {
    changeRequiresRestart: true,
    displayString: "time",
  },
  mode: {
    changeRequiresRestart: true,
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
    displayString: "quote length",
    changeRequiresRestart: true,
  },
  language: {
    displayString: "language",
    changeRequiresRestart: true,
  },
  burstHeatmap: {
    displayString: "burst heatmap",
    changeRequiresRestart: false,
  },

  // behavior
  difficulty: {
    changeRequiresRestart: true,
  },
  quickRestart: {
    displayString: "quick restart",
    changeRequiresRestart: false,
  },
  repeatQuotes: {
    displayString: "repeat quotes",
    changeRequiresRestart: false,
  },
  blindMode: {
    displayString: "blind mode",
    changeRequiresRestart: false,
  },
  alwaysShowWordsHistory: {
    displayString: "always show words history",
    changeRequiresRestart: false,
  },
  singleListCommandLine: {
    displayString: "single list command line",
    changeRequiresRestart: false,
  },
  minWpm: {
    displayString: "min speed",
    changeRequiresRestart: true,
  },
  minWpmCustomSpeed: {
    displayString: "min speed custom",
    changeRequiresRestart: true,
  },
  minAcc: {
    displayString: "min accuracy",
    changeRequiresRestart: true,
  },
  minAccCustom: {
    displayString: "min accuracy custom",
    changeRequiresRestart: true,
  },
  minBurst: {
    displayString: "min burst",
    changeRequiresRestart: true,
  },
  minBurstCustomSpeed: {
    displayString: "min burst custom speed",
    changeRequiresRestart: true,
  },
  britishEnglish: {
    displayString: "british english",
    changeRequiresRestart: true,
  },
  funbox: {
    changeRequiresRestart: true,
    isBlocked: ({ value, currentConfig }) => {
      for (const funbox of currentConfig.funbox) {
        if (!canSetFunboxWithConfig(funbox, currentConfig)) {
          Notifications.add(
            `${value}" cannot be enabled with the current config`,
            0
          );
          return true;
        }
      }
      return false;
    },
  },
  customLayoutfluid: {
    displayString: "custom layoutfluid",
    changeRequiresRestart: true,
    overrideValue: ({ value }) => {
      return Array.from(new Set(value));
    },
  },
  customPolyglot: {
    displayString: "custom polyglot",
    changeRequiresRestart: false,
    overrideValue: ({ value }) => {
      return Array.from(new Set(value));
    },
  },

  // input
  freedomMode: {
    changeRequiresRestart: false,
    displayString: "freedom mode",
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
    displayString: "strict space",
    changeRequiresRestart: true,
  },
  oppositeShiftMode: {
    displayString: "opposite shift mode",
    changeRequiresRestart: false,
  },
  stopOnError: {
    displayString: "stop on error",
    changeRequiresRestart: true,
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
    displayString: "confidence mode",
    changeRequiresRestart: false,
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
    displayString: "quick end",
    changeRequiresRestart: false,
  },
  indicateTypos: {
    displayString: "indicate typos",
    changeRequiresRestart: false,
  },
  hideExtraLetters: {
    displayString: "hide extra letters",
    changeRequiresRestart: false,
  },
  lazyMode: {
    displayString: "lazy mode",
    changeRequiresRestart: true,
  },
  layout: {
    displayString: "layout",
    changeRequiresRestart: true,
  },
  codeUnindentOnBackspace: {
    displayString: "code unindent on backspace",
    changeRequiresRestart: true,
  },

  // sound
  soundVolume: {
    displayString: "sound volume",
    changeRequiresRestart: false,
  },
  playSoundOnClick: {
    displayString: "play sound on click",
    changeRequiresRestart: false,
  },
  playSoundOnError: {
    displayString: "play sound on error",
    changeRequiresRestart: false,
  },
  playTimeWarning: {
    displayString: "play time warning",
    changeRequiresRestart: false,
  },

  // caret
  smoothCaret: {
    displayString: "smooth caret",
    changeRequiresRestart: false,
  },
  caretStyle: {
    displayString: "caret style",
    changeRequiresRestart: false,
  },
  paceCaret: {
    displayString: "pace caret",
    changeRequiresRestart: false,
    isBlocked: ({ value }) => {
      if (document.readyState === "complete") {
        if ((value === "pb" || value === "tagPb") && !isAuthenticated()) {
          Notifications.add(
            `Pace caret "pb" and "tag pb" are unavailable without an account`,
            0
          );
          return true;
        }
      }
      return false;
    },
  },
  paceCaretCustomSpeed: {
    displayString: "pace caret custom speed",
    changeRequiresRestart: false,
  },
  paceCaretStyle: {
    displayString: "pace caret style",
    changeRequiresRestart: false,
  },
  repeatedPace: {
    displayString: "repeated pace",
    changeRequiresRestart: false,
  },

  // appearance
  timerStyle: {
    displayString: "timer style",
    changeRequiresRestart: false,
  },
  liveSpeedStyle: {
    displayString: "live speed style",
    changeRequiresRestart: false,
  },
  liveAccStyle: {
    displayString: "live accuracy style",
    changeRequiresRestart: false,
  },
  liveBurstStyle: {
    displayString: "live burst style",
    changeRequiresRestart: false,
  },
  timerColor: {
    displayString: "timer color",
    changeRequiresRestart: false,
  },
  timerOpacity: {
    displayString: "timer opacity",
    changeRequiresRestart: false,
  },
  highlightMode: {
    displayString: "highlight mode",
    changeRequiresRestart: false,
  },
  tapeMode: {
    triggerResize: true,
    changeRequiresRestart: false,
    displayString: "tape mode",
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
    displayString: "tape margin",
    changeRequiresRestart: false,
    overrideValue: ({ value }) => {
      //TODO move to migration after settings validation
      if (value < 10) {
        value = 10;
      }
      if (value > 90) {
        value = 90;
      }
      return value;
    },
  },
  smoothLineScroll: {
    displayString: "smooth line scroll",
    changeRequiresRestart: false,
  },
  showAllLines: {
    changeRequiresRestart: false,
    displayString: "show all lines",
    isBlocked: ({ value, currentConfig }) => {
      if (value && currentConfig.tapeMode !== "off") {
        Notifications.add("Show all lines doesn't support tape mode.", 0);
        return true;
      }
      return false;
    },
  },
  alwaysShowDecimalPlaces: {
    displayString: "always show decimal places",
    changeRequiresRestart: false,
  },
  typingSpeedUnit: {
    displayString: "typing speed unit",
    changeRequiresRestart: false,
  },
  startGraphsAtZero: {
    displayString: "start graphs at zero",
    changeRequiresRestart: false,
  },
  maxLineWidth: {
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "max line width",
    overrideValue: ({ value }) => {
      //TODO move to migration after settings validation
      if (value < 20 && value !== 0) {
        value = 20;
      }
      if (value > 1000) {
        value = 1000;
      }
      return value;
    },
  },
  fontSize: {
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "font size",
    overrideValue: ({ value }) => {
      //TODO move to migration after settings validation
      if (value < 0) {
        value = 1;
      }
      return value;
    },
  },
  fontFamily: {
    displayString: "font family",
    changeRequiresRestart: false,
  },
  keymapMode: {
    displayString: "keymap mode",
    changeRequiresRestart: false,
  },
  keymapLayout: {
    displayString: "keymap layout",
    changeRequiresRestart: false,
  },
  keymapStyle: {
    displayString: "keymap style",
    changeRequiresRestart: false,
  },
  keymapLegendStyle: {
    displayString: "keymap legend style",
    changeRequiresRestart: false,
  },
  keymapShowTopRow: {
    displayString: "keymap show top row",
    changeRequiresRestart: false,
  },
  keymapSize: {
    triggerResize: true,
    changeRequiresRestart: false,
    displayString: "keymap size",
    overrideValue: ({ value }) => {
      if (value < 0.5) value = 0.5;
      if (value > 3.5) value = 3.5;
      return roundTo1(value);
    },
  },

  // theme
  flipTestColors: {
    displayString: "flip test colors",
    changeRequiresRestart: false,
  },
  colorfulMode: {
    displayString: "colorful mode",
    changeRequiresRestart: false,
  },
  customBackground: {
    displayString: "custom background",
    changeRequiresRestart: false,
    overrideValue: ({ value }) => {
      return value.trim();
    },
  },
  customBackgroundSize: {
    displayString: "custom background size",
    changeRequiresRestart: false,
  },
  customBackgroundFilter: {
    displayString: "custom background filter",
    changeRequiresRestart: false,
  },
  autoSwitchTheme: {
    displayString: "auto switch theme",
    changeRequiresRestart: false,
  },
  themeLight: {
    displayString: "theme light",
    changeRequiresRestart: false,
  },
  themeDark: {
    displayString: "theme dark",
    changeRequiresRestart: false,
  },
  randomTheme: {
    changeRequiresRestart: false,
    displayString: "random theme",
    isBlocked: ({ value }) => {
      if (value === "custom") {
        const snapshot = DB.getSnapshot();
        if (!isAuthenticated()) {
          Notifications.add(
            "Random theme 'custom' is unavailable without an account",
            0
          );
          return true;
        }
        if (!snapshot) {
          Notifications.add(
            "Random theme 'custom' requires a snapshot to be set",
            0
          );
          return true;
        }
        if (snapshot?.customThemes?.length === 0) {
          Notifications.add(
            "Random theme 'custom' requires at least one custom theme to be saved",
            0
          );
          return true;
        }
      }
      return false;
    },
  },
  favThemes: {
    displayString: "favorite themes",
    changeRequiresRestart: false,
  },
  theme: {
    changeRequiresRestart: false,
    overrideConfig: () => {
      return {
        customTheme: false,
      };
    },
  },
  customTheme: {
    displayString: "custom theme",
    changeRequiresRestart: false,
  },
  customThemeColors: {
    displayString: "custom theme colors",
    changeRequiresRestart: false,
  },

  // hide elements
  showKeyTips: {
    displayString: "show key tips",
    changeRequiresRestart: false,
  },
  showOutOfFocusWarning: {
    displayString: "show out of focus warning",
    changeRequiresRestart: false,
  },
  capsLockWarning: {
    displayString: "caps lock warning",
    changeRequiresRestart: false,
  },
  showAverage: {
    displayString: "show average",
    changeRequiresRestart: false,
  },

  // other (hidden)
  accountChart: {
    displayString: "account chart",
    changeRequiresRestart: false,
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
    displayString: "monkey",
    changeRequiresRestart: false,
  },
  monkeyPowerLevel: {
    displayString: "monkey power level",
    changeRequiresRestart: false,
  },

  // ads
  ads: {
    changeRequiresRestart: false,
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
