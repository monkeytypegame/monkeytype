import { checkCompatibility } from "@monkeytype/funbox";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { roundTo1 } from "@monkeytype/util/numbers";
import { JSXElement } from "solid-js";

import { getDefaultConfig } from "../constants/default-config";
import * as DB from "../db";
import { isAuthenticated } from "../states/core";
import { showNoticeNotification } from "../states/notifications";
import { FaObject } from "../types/font-awesome";
import { isDevEnvironment } from "../utils/env";
import { reloadAfter } from "../utils/misc";
import { capitalizeFirstLetter } from "../utils/strings";
import { canSetFunboxWithConfig } from "./funbox-validation";
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

  description?: string | JSXElement;

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
    : ConfigSchemas.Config[K] extends boolean
      ? Partial<{
          true: {
            displayString?: string;
            fa?: FaObject;
          };
          false: {
            displayString?: string;
            fa?: FaObject;
          };
        }>
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
    description: "Change in which language you want to type.",
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
    description:
      "Normal is the classic typing test experience. Expert fails the test if you submit (press space) an incorrect word. Master fails if you press a single incorrect key (meaning you have to achieve 100% accuracy).",
  },
  quickRestart: {
    key: "quickRestart",
    fa: { icon: "fa-redo-alt" },
    displayString: "quick restart",
    changeRequiresRestart: false,
    group: "behavior",
    description:
      'Press tab, esc or enter to quickly restart the test, or to quickly jump to the test page. These options disable tab navigation on most parts of the website. Using the "esc" option will move opening the commandline to the tab key.',
  },
  repeatQuotes: {
    key: "repeatQuotes",
    fa: { icon: "fa-sync-alt" },
    displayString: "repeat quotes",
    changeRequiresRestart: false,
    group: "behavior",
    description:
      "This setting changes the restarting behavior when typing in quote mode. Changing it to 'typing' will repeat the quote if you restart while typing.",
  },
  resultSaving: {
    key: "resultSaving",
    fa: { icon: "fa-save" },
    displayString: "result saving",
    changeRequiresRestart: false,
    group: "behavior",
    description:
      "Disable result saving, in case you want to practice without affecting your account stats.",
  },
  blindMode: {
    key: "blindMode",
    fa: { icon: "fa-eye-slash" },
    optionsMetadata: {
      true: {
        displayString: "‎",
      },
    },
    displayString: "blind mode",
    changeRequiresRestart: false,
    group: "behavior",
    description:
      "No errors or incorrect words are highlighted. Helps you to focus on raw speed. If enabled, quick end is recommended.",
  },
  alwaysShowWordsHistory: {
    key: "alwaysShowWordsHistory",
    fa: { icon: "fa-align-left" },
    displayString: "always show words history",
    changeRequiresRestart: false,
    group: "behavior",
    description:
      "This option will automatically show the words history at the end of the test. Can cause slight lag with a lot of words.",
  },
  singleListCommandLine: {
    key: "singleListCommandLine",
    fa: { icon: "fa-list" },
    displayString: "single list command line",
    changeRequiresRestart: false,
    group: "behavior",
    description:
      "When enabled, it will show the command line with all commands in a single list instead of submenu arrangements. Selecting 'manual' will expose all commands only after typing >.",
  },
  minWpm: {
    key: "minWpm",
    fa: { icon: "fa-bomb" },
    displayString: "min speed",
    changeRequiresRestart: true,
    group: "behavior",
    description:
      "Automatically fails a test if your speed falls below a threshold.",
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
    description:
      "Automatically fails a test if your accuracy falls below a threshold.",
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
    description:
      "Automatically fails a test if your raw for a single word falls below this threshold. Selecting 'flex' allows for this threshold to automatically decrease for longer words.",
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
    description:
      "When enabled, the website will use the British spelling instead of American. Note that this might not replace all words correctly. If you find any issues, please let us know.",
  },
  funbox: {
    key: "funbox",
    fa: { icon: "fa-gamepad" },
    changeRequiresRestart: true,
    group: "behavior",
    description:
      "These are special modes that change the website in some special way (by altering the word generation, behavior of the website or the looks). Give each one of them a try!",
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
    description:
      "Select which layouts you want the layoutfluid funbox to cycle through.",
    overrideValue: ({ value }) => {
      return Array.from(new Set(value));
    },
  },
  customPolyglot: {
    key: "customPolyglot",
    fa: { icon: "fa-language" },
    displayString: "polyglot languages",
    changeRequiresRestart: false,
    group: "behavior",
    description: "Select which languages you want the polyglot funbox to use.",
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
    description:
      "Allows you to delete any word, even if it was typed correctly.",
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
    description:
      "Pressing space at the beginning of a word will insert a space character when this mode is enabled.",
  },
  oppositeShiftMode: {
    key: "oppositeShiftMode",
    fa: { icon: "fa-exchange-alt" },
    displayString: "opposite shift mode",
    changeRequiresRestart: false,
    group: "input",
    description:
      'This mode will force you to use opposite shift keys for shifting. Using an incorrect one will count as an error. This feature ignores keys in locations B, Y, and ^ because many people use the other hand for those keys. If you\'re using external software to emulate your layout (including QMK), you should use the "keymap" mode - the standard "on" will not work. This will enforce opposite shift based on the "keymap layout" setting.',
  },
  stopOnError: {
    key: "stopOnError",
    fa: { icon: "fa-hand-paper" },
    displayString: "stop on error",
    changeRequiresRestart: true,
    group: "input",
    description:
      "Letter mode will stop input when pressing any incorrect letters. Word mode will not allow you to continue to the next word until you correct all mistakes.",
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
    description:
      "When enabled, you will not be able to go back to previous words to fix mistakes. When turned up to the max, you won't be able to backspace at all.",
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
    description:
      "This only applies to the words mode - when enabled, the test will end as soon as the last word has been typed, even if it's incorrect. When disabled, you need to manually confirm the last incorrect entry with a space.",
  },
  indicateTypos: {
    key: "indicateTypos",
    fa: { icon: "fa-exclamation" },
    displayString: "indicate typos",
    changeRequiresRestart: false,
    group: "input",
    description:
      'Shows typos that you\'ve made. "Below" shows what you typed below the letters, "replace" will replace the letters with the ones you typed and "both" will do the same as replace and below, but it will show the correct letters below your mistakes.',
  },
  compositionDisplay: {
    key: "compositionDisplay",
    fa: { icon: "fa-language" },
    displayString: "composition display",
    changeRequiresRestart: false,
    group: "input",
    description:
      'Change how composition is displayed. "off" will just underline the letter if composition is active. "below" will show the composed character below the test. "replace" will replace the letter in the test with the composed character.',
  },
  hideExtraLetters: {
    key: "hideExtraLetters",
    fa: { icon: "fa-eye-slash" },
    displayString: "hide extra letters",
    changeRequiresRestart: false,
    group: "input",
    description:
      "Hides extra letters. This will completely avoid words jumping lines (due to changing width), but might feel a bit confusing when you press a key and nothing happens.",
  },
  lazyMode: {
    key: "lazyMode",
    fa: { icon: "fa-couch" },
    displayString: "lazy mode",
    changeRequiresRestart: true,
    group: "input",
    description:
      "Replaces accents / diacritics / special characters with their normal letter equivalents.",
  },
  layout: {
    key: "layout",
    fa: { icon: "fa-keyboard" },
    displayString: "layout",
    changeRequiresRestart: true,
    group: "input",
    description:
      "With this setting you can emulate other layouts. This setting is best kept off, as it can break things like dead keys and alt layers.",
  },
  codeUnindentOnBackspace: {
    key: "codeUnindentOnBackspace",
    fa: { icon: "fa-code" },
    displayString: "code unindent on backspace",
    changeRequiresRestart: true,
    group: "input",
    description:
      "Automatically go back to the previous line when deleting line leading tab characters. Only works in code languages.",
  },

  // sound
  soundVolume: {
    key: "soundVolume",
    fa: { icon: "fa-volume-down" },
    displayString: "sound volume",
    changeRequiresRestart: false,
    group: "sound",
    description: "Change the volume of the sound effects.",
  },
  playSoundOnClick: {
    key: "playSoundOnClick",
    fa: { icon: "fa-volume-up" },
    displayString: "play sound on click",
    changeRequiresRestart: false,
    group: "sound",
    description: "Plays a short sound when you press a key.",
  },
  playSoundOnError: {
    key: "playSoundOnError",
    fa: { icon: "fa-volume-mute" },
    displayString: "play sound on error",
    changeRequiresRestart: false,
    group: "sound",
    description:
      "Plays a short sound if you press an incorrect key or press space too early.",
  },
  playTimeWarning: {
    key: "playTimeWarning",
    fa: { icon: "fa-exclamation-triangle" },
    displayString: "play time warning",
    changeRequiresRestart: false,
    group: "sound",
    description:
      "Play a short warning sound if you are close to the end of a timed test.",
  },

  // caret
  smoothCaret: {
    key: "smoothCaret",
    fa: { icon: "fa-i-cursor" },
    displayString: "smooth caret",
    changeRequiresRestart: false,
    group: "caret",
    description: "The caret will move smoothly between letters and words.",
  },
  caretStyle: {
    key: "caretStyle",
    fa: { icon: "fa-i-cursor" },
    displayString: "caret style",
    changeRequiresRestart: false,
    group: "caret",
    description: "Change the style of the caret during the test.",
  },
  paceCaret: {
    key: "paceCaret",
    fa: { icon: "fa-i-cursor" },
    displayString: "pace caret",
    changeRequiresRestart: false,
    group: "caret",
    description:
      "Displays a second caret that moves at constant speed. The 'average' option averages the speed of last 10 results. The 'tag pb' option takes the highest PB of any active tag. The 'daily' option takes the highest speed of the last 24 hours.",
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
    description: "Change the style of the pace caret during the test.",
  },
  repeatedPace: {
    key: "repeatedPace",
    fa: { icon: "fa-i-cursor" },
    displayString: "repeated pace",
    changeRequiresRestart: false,
    group: "caret",
    description:
      "When repeating a test, a pace caret will automatically be enabled for one test with the speed of your previous test. It does not override the pace caret if it's already enabled.",
  },

  // appearance
  timerStyle: {
    key: "timerStyle",
    fa: { icon: "fa-chart-pie" },
    displayString: "live progress style",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      'Change the style of the timer/word count during a test. "Flash" styles will briefly show the timer in timed modes every 15 seconds.',
  },
  liveSpeedStyle: {
    key: "liveSpeedStyle",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "live speed style",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Change the style of the live speed displayed during the test.",
  },
  liveAccStyle: {
    key: "liveAccStyle",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "live accuracy style",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Change the style of the live accuracy displayed during the test.",
  },
  liveBurstStyle: {
    key: "liveBurstStyle",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "live word burst style",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Change the style of the live burst speed displayed during the test.",
  },
  timerColor: {
    key: "timerColor",
    fa: { icon: "fa-chart-pie" },
    displayString: "timer color",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Change the color of the progress, live speed, accuracy and burst text.",
  },
  timerOpacity: {
    key: "timerOpacity",
    fa: { icon: "fa-chart-pie" },
    displayString: "timer opacity",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Change the opacity of the progress, live speed, burst and accuracy text.",
  },
  highlightMode: {
    key: "highlightMode",
    fa: { icon: "fa-highlighter" },
    displayString: "highlight mode",
    changeRequiresRestart: false,
    group: "appearance",
    description: "Change what is highlighted during the test.",
  },
  typedEffect: {
    key: "typedEffect",
    fa: { icon: "fa-eye" },
    displayString: "typed effect",
    changeRequiresRestart: false,
    group: "appearance",
    description: "Change how typed words are shown.",
  },
  tapeMode: {
    key: "tapeMode",
    fa: { icon: "fa-tape" },
    triggerResize: true,
    changeRequiresRestart: false,
    displayString: "tape mode",
    group: "appearance",
    description:
      "Only shows one line which scrolls horizontally. Setting this to 'word' will make it scroll after every word and 'letter' will scroll after every keypress. Works best with smooth line scroll enabled and a monospace font.",
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
    description:
      "When in tape mode, set the carets position from the left edge of the typing test as a percentage (for example, 50% centers it).",
  },
  smoothLineScroll: {
    key: "smoothLineScroll",
    fa: { icon: "fa-align-left" },
    displayString: "smooth line scroll",
    changeRequiresRestart: false,
    group: "appearance",
    description: "When enabled, the line transition will be animated.",
  },
  showAllLines: {
    key: "showAllLines",
    fa: { icon: "fa-align-left" },
    changeRequiresRestart: false,
    displayString: "show all lines",
    group: "appearance",
    description:
      "When enabled, the website will show all lines for word, custom and quote mode tests - otherwise the lines will be limited to 3, and will automatically scroll. Using this could cause the timer text and live speed to not be visible.",
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
    description:
      "Always shows decimal places for values on the result page, without the need to hover over the stats.",
  },
  typingSpeedUnit: {
    key: "typingSpeedUnit",
    fa: { icon: "fa-tachometer-alt" },
    displayString: "typing speed unit",
    changeRequiresRestart: false,
    group: "appearance",
    description: "Display typing speed in the specified unit.",
  },
  startGraphsAtZero: {
    key: "startGraphsAtZero",
    fa: { icon: "fa-chart-line" },
    displayString: "start graphs at zero",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Force graph axis to always start at zero, no matter what the data is. Turning this off may exaggerate the value changes.",
  },
  maxLineWidth: {
    key: "maxLineWidth",
    fa: { icon: "fa-text-width" },
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "max line width",
    group: "appearance",
    description:
      "Change the maximum width of the typing test, measured in characters. Setting this to 0 will align the words to the edges of the content area.",
  },
  fontSize: {
    key: "fontSize",
    fa: { icon: "fa-font" },
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "font size",
    group: "appearance",
    description: "Change the font size of the test words.",
  },
  fontFamily: {
    key: "fontFamily",
    fa: { icon: "fa-font" },
    displayString: "font family",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Change the font family used by the website. Using a local font will override your choice.",
  },
  keymapMode: {
    key: "keymapMode",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap mode",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Displays your current layout while taking a test. React shows what you pressed and Next shows what you need to press next.",
  },
  keymapLayout: {
    key: "keymapLayout",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap layout",
    changeRequiresRestart: false,
    group: "appearance",
    description: "Controls which layout is displayed on the keymap.",
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
    description: "Change the size of the keymap.",
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
    description:
      "By default, typed text is brighter than the future text. When enabled, the colors will be flipped and the future text will be brighter than the already typed text.",
  },
  colorfulMode: {
    key: "colorfulMode",
    fa: { icon: "fa-fill-drip" },
    displayString: "colorful mode",
    changeRequiresRestart: false,
    group: "theme",
    description:
      "When enabled, the test words will use the main color, instead of the text color, making the website more colorful.",
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
    description:
      "Set an image url or local image to be a custom background image. Cover fits the image to cover the screen. Contain fits the image to be fully visible. Max fits the image corner to corner.",
  },
  customBackgroundFilter: {
    key: "customBackgroundFilter",
    fa: { icon: "fa-image" },
    displayString: "custom background filter",
    changeRequiresRestart: false,
    group: "theme",
    description: "Apply various effects to the custom background.",
  },
  autoSwitchTheme: {
    key: "autoSwitchTheme",
    fa: { icon: "fa-palette" },
    displayString: "auto switch theme",
    changeRequiresRestart: false,
    group: "theme",
    description:
      "Enabling this will automatically switch the theme between light and dark depending on the system theme.",
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
    description:
      "After completing a test, the theme will be set to a random one. The random themes are not saved to your config. If set to 'favorite' only favorite themes will be randomized. If set to 'light' or 'dark', only presets with light or dark background colors will be randomized, respectively. If set to 'auto' dark or light themes are used, depending on your system theme. If set to 'custom', custom themes will be randomized.",
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
    description: "Shows the keybind tips at the bottom of the page.",
  },
  showOutOfFocusWarning: {
    key: "showOutOfFocusWarning",
    fa: { icon: "fa-exclamation" },
    displayString: "show out of focus warning",
    changeRequiresRestart: false,
    group: "hideElements",
    description:
      "Shows an out of focus reminder after 1 second of being 'out of focus' (not being able to type).",
  },
  capsLockWarning: {
    key: "capsLockWarning",
    fa: { icon: "fa-exclamation-triangle" },
    displayString: "caps lock warning",
    changeRequiresRestart: false,
    group: "hideElements",
    description: "Displays a warning when caps lock is on.",
  },
  showAverage: {
    key: "showAverage",
    fa: { icon: "fa-chart-bar" },
    displayString: "show average",
    changeRequiresRestart: false,
    group: "hideElements",
    description:
      "Displays your average speed and/or accuracy over the last 10 tests.",
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
