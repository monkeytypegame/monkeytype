import * as ConfigSchemas from "@monkeytype/schemas/configs";
import * as SoundController from "../controllers/sound-controller";
import * as TestLogic from "../test/test-logic";
import { getLanguageDisplayString } from "../utils/strings";
import * as ModesNotice from "../elements/modes-notice";
import { isAuthenticated } from "../firebase";
import * as ManualRestart from "../test/manual-restart-tracker";
import { areUnsortedArraysEqual } from "../utils/arrays";
import Config from "../config";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import { Validation } from "../elements/input-validation";
import { getActivePage } from "../signals/core";
import { Fonts } from "../constants/fonts";
import { KnownFontName } from "@monkeytype/schemas/fonts";
import * as UI from "../ui";
import { typedKeys } from "../utils/misc";

type ConfigKeysWithoutCommands =
  | "minWpmCustomSpeed"
  | "minAccCustom"
  | "minBurstCustomSpeed"
  | "accountChart"
  | "customThemeColors"
  | "favThemes"
  | "paceCaretCustomSpeed"
  | "autoSwitchTheme"
  | "themeLight"
  | "themeDark"
  | "burstHeatmap";

type SkippedConfigKeys =
  | "minBurst" //this is skipped for now because it has 2 nested inputs;
  | "customBackgroundFilter" //this is skipped for now because it has 4 nested inputs;
  | "theme" //themes are sorted by color and also affected by config.favThemes
  | "funbox"; //is using a special non schema command at the top to clear funboxes

export type CommandlineConfigMetadataObject = {
  [K in keyof Omit<
    ConfigSchemas.Config,
    ConfigKeysWithoutCommands | SkippedConfigKeys
    // oxlint-disable-next-line no-explicit-any
  >]: CommandlineConfigMetadata<K, any>;
};

export type InputProps<T extends keyof ConfigSchemas.Config> = {
  alias?: string;
  display?: string;
  afterExec?: (value: ConfigSchemas.Config[T]) => void;
  defaultValue?: () => string;
  /**
   * default value for missing validation is `{schema:true}`
   */
  validation?: Omit<Validation<ConfigSchemas.Config[T]>, "schema"> & {
    schema?: true;
  };
  hover?: () => void;
  configValue?: ConfigSchemas.Config[T];
  inputValueConvert: ConfigSchemas.Config[T] extends string
    ? ((val: string) => string) | undefined
    : (val: string) => ConfigSchemas.Config[T];
};

export type SecondaryInputProps<T extends keyof ConfigSchemas.Config> = {
  secondKey: T;
} & InputProps<T>;

export type CommandlineConfigMetadata<
  T extends keyof ConfigSchemas.Config,
  T2 extends keyof ConfigSchemas.Config,
> = {
  alias?: string;
  display?: string;
  isVisible?: boolean;
  input?: InputProps<T> | SecondaryInputProps<T2> | Record<never, never>;
  subgroup?: SubgroupProps<T>;
};

export type SubgroupProps<T extends keyof ConfigSchemas.Config> = {
  alias?: (value: ConfigSchemas.Config[T]) => string;
  display?: (value: ConfigSchemas.Config[T]) => string;
  configValueMode?: (value: ConfigSchemas.Config[T]) => "include" | undefined;
  isVisible?: (value: ConfigSchemas.Config[T]) => boolean;
  isAvailable?: (value: ConfigSchemas.Config[T]) => (() => boolean) | undefined;
  customData?: (
    value: ConfigSchemas.Config[T],
  ) => Record<string, string | boolean>;
  hover?: (value: ConfigSchemas.Config[T]) => void;
  afterExec?: (value: ConfigSchemas.Config[T]) => void;
  options: "fromSchema" | ConfigSchemas.Config[T][];
};

export const commandlineConfigMetadata: CommandlineConfigMetadataObject = {
  //test
  punctuation: {
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  numbers: {
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  words: {
    alias: "words",
    subgroup: {
      options: [10, 25, 50, 100],
      afterExec: () => {
        ManualRestart.set();
        TestLogic.restart();
      },
    },
    input: {
      inputValueConvert: Number,

      afterExec: () => {
        ManualRestart.set();
        TestLogic.restart();
      },
    },
  },
  time: {
    subgroup: {
      options: [15, 30, 60, 120],
      afterExec: () => {
        ManualRestart.set();
        TestLogic.restart();
      },
    },
    input: {
      inputValueConvert: Number,
      afterExec: () => {
        ManualRestart.set();
        TestLogic.restart();
      },
    },
  },
  mode: {
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        ManualRestart.set();
        TestLogic.restart();
      },
    },
  },
  quoteLength: {
    alias: "quotes",
    subgroup: {
      options: [[0, 1, 2, 3], [0], [1], [2], [3], [-3]],
      configValueMode: () => "include",
      isAvailable: (value) => {
        if (value[0] === -3) {
          return isAuthenticated;
        }
        return undefined;
      },
      display: (value) => {
        if (areUnsortedArraysEqual(value, [0, 1, 2, 3])) {
          return "all";
        }

        const map: Record<number, string> = {
          0: "short",
          1: "medium",
          2: "long",
          3: "thicc",
          "-3": "favorite",
        };

        return map[value[0] as number] as string;
      },
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  language: {
    subgroup: {
      options: "fromSchema",
      display: (value) => {
        return getLanguageDisplayString(value);
      },
    },
  },
  //behavior
  difficulty: {
    subgroup: {
      options: "fromSchema",
    },
  },
  quickRestart: {
    subgroup: {
      options: "fromSchema",
    },
  },
  repeatQuotes: {
    subgroup: {
      options: "fromSchema",
    },
  },
  resultSaving: {
    subgroup: {
      options: "fromSchema",
      alias: (val) => (val ? "enabled" : "disabled"),
    },
    alias: "results practice incognito",
  },
  blindMode: {
    subgroup: {
      options: "fromSchema",
    },
  },
  alwaysShowWordsHistory: {
    subgroup: {
      options: "fromSchema",
    },
  },
  singleListCommandLine: {
    subgroup: {
      options: "fromSchema",
    },
  },
  minWpm: {
    display: "Minimum speed...",
    alias: "wpm",
    subgroup: {
      options: ["off"],
    },
    input: {
      configValue: "custom",
      display: "custom...",
      secondKey: "minWpmCustomSpeed",
      inputValueConvert: (value) => {
        let newVal = Number(value);
        newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(newVal);
        return newVal;
      },
    },
  },
  minAcc: {
    display: "Minimum accuracy...",
    subgroup: {
      options: ["off"],
    },
    input: {
      configValue: "custom",
      display: "custom...",
      secondKey: "minAccCustom",
      inputValueConvert: (value) => {
        return Number(value);
      },
    },
  },
  // minBurst: null,
  britishEnglish: {
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  // funbox: null,
  customLayoutfluid: {
    input: {
      defaultValue: () => {
        return Config.customLayoutfluid.join(" ");
      },
      inputValueConvert: (val) =>
        val.trim().split(" ") as ConfigSchemas.CustomLayoutFluid,
    },
  },
  customPolyglot: {
    input: {
      defaultValue: () => {
        return Config.customPolyglot.join(" ");
      },
      inputValueConvert: (val) =>
        val.trim().split(" ") as ConfigSchemas.CustomPolyglot,
      afterExec: () => {
        if (getActivePage() === "test") {
          TestLogic.restart();
        }
      },
    },
  },
  //input
  freedomMode: {
    subgroup: {
      options: "fromSchema",
    },
  },
  strictSpace: {
    subgroup: {
      options: "fromSchema",
    },
  },
  oppositeShiftMode: {
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        void ModesNotice.update();
      },
    },
  },
  stopOnError: {
    subgroup: {
      options: "fromSchema",
    },
  },
  confidenceMode: {
    subgroup: {
      options: "fromSchema",
    },
  },
  quickEnd: {
    subgroup: {
      options: "fromSchema",
    },
  },
  indicateTypos: {
    subgroup: {
      options: "fromSchema",
    },
  },
  compositionDisplay: {
    subgroup: {
      options: "fromSchema",
    },
  },
  hideExtraLetters: {
    subgroup: {
      options: "fromSchema",
    },
  },
  lazyMode: {
    subgroup: {
      options: "fromSchema",
      afterExec: () => TestLogic.restart(),
    },
  },
  layout: {
    subgroup: {
      options: "fromSchema",
      display: (layout) =>
        layout === "default" ? "off" : layout.replace(/_/g, " "),
      afterExec: () => TestLogic.restart(),
    },
  },
  codeUnindentOnBackspace: {
    subgroup: {
      options: "fromSchema",
    },
  },
  //sound
  soundVolume: {
    subgroup: {
      options: [0.1, 0.5, 1],
      display: (val) =>
        new Map([
          [0.1, "quiet"],
          [0.5, "medium"],
          [1.0, "loud"],
        ]).get(val) ?? "custom...",
      afterExec: () => SoundController.playClick,
    },
    input: {
      inputValueConvert: Number,
    },
  },
  playSoundOnClick: {
    alias: "play",
    display: "Sound on click...",
    subgroup: {
      options: "fromSchema",
      display: (value) => {
        const map: Record<ConfigSchemas.Config["playSoundOnClick"], string> = {
          off: "off",
          "1": "click",
          "2": "beep",
          "3": "pop",
          "4": "nk creams",
          "5": "typewriter",
          "6": "osu",
          "7": "hitmarker",
          "8": "sine",
          "9": "sawtooth",
          "10": "square",
          "11": "triangle",
          "12": "pentatonic",
          "13": "wholetone",
          "14": "fist fight",
          "15": "rubber keys",
          "16": "fart",
        };
        return map[value];
      },
      hover: (value) => {
        if (value === "off") {
          return;
        }
        void SoundController.previewClick(value);
      },
      afterExec: () => {
        void SoundController.playClick();
      },
    },
  },
  playSoundOnError: {
    alias: "play",
    display: "Sound on error...",
    subgroup: {
      options: "fromSchema",
      display: (value) => {
        const map: Record<ConfigSchemas.Config["playSoundOnError"], string> = {
          off: "off",
          "1": "damage",
          "2": "triangle",
          "3": "square",
          "4": "punch miss",
        };
        return map[value];
      },
      hover: (value) => {
        if (value === "off") {
          return;
        }
        void SoundController.previewError(value);
      },
      afterExec: () => {
        void SoundController.playError();
      },
    },
  },
  playTimeWarning: {
    alias: "sound",
    subgroup: {
      options: "fromSchema",
      display: (value) => {
        if (value === "off") {
          return "off";
        }
        return `${value} second${value !== "1" ? "s" : ""}`;
      },
      afterExec: (value) => {
        if (value !== "off") {
          void SoundController.playTimeWarning();
        }
      },
      hover: (value) => {
        if (value !== "off") {
          void SoundController.playTimeWarning();
        }
      },
    },
  },
  //caret
  smoothCaret: {
    subgroup: {
      options: "fromSchema",
    },
  },
  caretStyle: {
    subgroup: {
      options: "fromSchema",
      isVisible: (value) => !["banana", "carrot", "monkey"].includes(value),
    },
  },
  paceCaret: {
    display: "Pace caret mode...",
    subgroup: {
      options: ["off", "pb", "tagPb", "last", "average", "daily"],
      afterExec: () => {
        TestLogic.restart();
      },
    },
    input: {
      secondKey: "paceCaretCustomSpeed",
      configValue: "custom",
      inputValueConvert: (value) => {
        let newVal = Number(value);
        newVal = getTypingSpeedUnit(Config.typingSpeedUnit).toWpm(newVal);
        return newVal;
      },
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  repeatedPace: {
    subgroup: {
      options: "fromSchema",
    },
  },
  paceCaretStyle: {
    subgroup: {
      options: "fromSchema",
      isVisible: (value) => !["banana", "carrot", "monkey"].includes(value),
    },
  },

  //appearence
  liveSpeedStyle: {
    subgroup: {
      options: "fromSchema",
    },
    alias: "wpm",
  },
  liveAccStyle: {
    subgroup: {
      options: "fromSchema",
    },
    alias: "wpm",
  },
  liveBurstStyle: {
    subgroup: {
      options: "fromSchema",
    },
    alias: "wpm",
  },
  timerStyle: {
    subgroup: {
      options: "fromSchema",
      display: (value) => value.replaceAll(/_/g, " "),
    },
    alias: "timer",
  },
  timerColor: {
    display: "Live progress color...",
    alias: "timer speed wpm burst acc",
    subgroup: {
      options: "fromSchema",
      alias: () => "timer",
    },
  },
  timerOpacity: {
    display: "Live progress opacity...",
    alias: "timer speed wpm burst acc",
    subgroup: {
      options: "fromSchema",
      alias: () => "timer",
    },
  },
  highlightMode: {
    subgroup: {
      options: "fromSchema",
    },
  },
  typedEffect: {
    subgroup: {
      options: "fromSchema",
    },
  },
  tapeMode: {
    subgroup: {
      options: "fromSchema",
    },
  },
  tapeMargin: {
    input: {
      inputValueConvert: Number,
    },
  },
  smoothLineScroll: {
    subgroup: {
      options: "fromSchema",
    },
  },
  showAllLines: {
    subgroup: {
      options: "fromSchema",
    },
  },
  typingSpeedUnit: {
    subgroup: {
      options: "fromSchema",
      isVisible: (val) => val !== "wph",
    },
  },
  alwaysShowDecimalPlaces: {
    subgroup: {
      options: "fromSchema",
    },
  },
  startGraphsAtZero: {
    subgroup: {
      options: "fromSchema",
    },
  },
  maxLineWidth: {
    input: {
      alias: "page",
      inputValueConvert: Number,
    },
  },
  fontSize: {
    input: {
      inputValueConvert: Number,
    },
  },
  fontFamily: {
    subgroup: {
      options: typedKeys(Fonts).sort((a, b) =>
        (Fonts[a]?.display ?? a.replace(/_/g, " ")).localeCompare(
          Fonts[b]?.display ?? b.replace(/_/g, " "),
        ),
      ),
      display: (name) =>
        Fonts[name as KnownFontName]?.display ?? name.replaceAll(/_/g, " "),
      customData: (name) => {
        const fontConfig = Fonts[name as KnownFontName];
        if (fontConfig === undefined) return {};
        return {
          name: name.replaceAll(/_/g, " "),
          isSystem: fontConfig.systemFont === true,
          display: fontConfig.display,
        } as Record<string, string | boolean>;
      },
      hover: (name) => UI.previewFontFamily(name),
    },
  },
  keymapMode: {
    alias: "keyboard",
    subgroup: {
      options: "fromSchema",
      alias: (val) => (val === "react" ? "flash" : ""),
    },
  },
  keymapStyle: {
    subgroup: {
      options: "fromSchema",
    },
    alias: "keyboard",
  },
  keymapLegendStyle: {
    subgroup: {
      options: "fromSchema",
    },
    alias: "keyboard",
  },
  keymapSize: {
    input: {
      alias: "keyboard",
      inputValueConvert: Number,
    },
  },
  keymapLayout: {
    alias: "keyboard",
    subgroup: {
      options: "fromSchema",
      alias: (val) => (val === "overrideSync" ? "default" : ""),
      display: (layout) =>
        layout === "overrideSync" ? "emulator sync" : layout.replace(/_/g, " "),
      afterExec: () => TestLogic.restart(),
    },
  },
  keymapShowTopRow: {
    subgroup: {
      options: "fromSchema",
    },
    alias: "keyboard",
  },

  //themes
  customTheme: {
    subgroup: {
      options: "fromSchema",
    },
  },
  flipTestColors: {
    subgroup: {
      options: "fromSchema",
    },
  },
  colorfulMode: {
    subgroup: {
      options: "fromSchema",
    },
  },
  customBackground: {
    input: {},
  },
  customBackgroundSize: {
    subgroup: {
      options: "fromSchema",
    },
  },
  randomTheme: {
    subgroup: {
      options: "fromSchema",
      isAvailable: (value) =>
        value === "custom" ? isAuthenticated : undefined,
    },
  },

  //showhide
  showKeyTips: {
    subgroup: {
      options: "fromSchema",
    },
    display: "Key tips...",
  },
  showOutOfFocusWarning: {
    subgroup: {
      options: "fromSchema",
    },
    display: "Out of focus warning...",
  },
  capsLockWarning: {
    subgroup: {
      options: "fromSchema",
    },
  },
  showAverage: {
    subgroup: {
      options: "fromSchema",
    },
  },
  showPb: {
    subgroup: {
      options: "fromSchema",
    },
    alias: "pb",
  },
  monkeyPowerLevel: {
    alias: "powermode",
    isVisible: false,
    subgroup: {
      options: "fromSchema",
      display: (value) => {
        const map: Record<ConfigSchemas.Config["monkeyPowerLevel"], string> = {
          off: "off",
          "1": "mellow",
          "2": "high",
          "3": "ultra",
          "4": "over 9000",
        };
        return map[value];
      },
    },
  },
  monkey: {
    subgroup: {
      options: "fromSchema",
    },
  },

  //danger zone
  ads: {
    subgroup: {
      options: "fromSchema",
    },
  },
};
