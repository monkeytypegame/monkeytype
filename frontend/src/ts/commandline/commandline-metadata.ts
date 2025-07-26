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
import * as ActivePage from "../states/active-page";
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
  >]: CommandlineConfigMetadata<K>;
};

export type CommandlineConfigMetadata<T extends keyof ConfigSchemas.Config> =
  | SubgroupMeta<T>
  | InputMeta<T>
  | SubgroupWithInputMeta<T>
  | SubgroupWithSecondKeyInputMeta<T, keyof ConfigSchemas.Config>;

export type SubgroupProps<T extends keyof ConfigSchemas.Config> = {
  commandAlias?: (value: ConfigSchemas.Config[T]) => string;
  commandDisplay?: (value: ConfigSchemas.Config[T]) => string;
  commandConfigValueMode?: (
    value: ConfigSchemas.Config[T]
  ) => "include" | undefined;
  isCommandVisible?: (value: ConfigSchemas.Config[T]) => boolean;
  isCommandAvailable?: (
    value: ConfigSchemas.Config[T]
  ) => (() => boolean) | undefined;
  commandCustomData?: (
    value: ConfigSchemas.Config[T]
  ) => Record<string, string | boolean>;
  hover?: (value: ConfigSchemas.Config[T]) => void;
  afterExec?: (value: ConfigSchemas.Config[T]) => void;
  options: "fromSchema" | ConfigSchemas.Config[T][];
};

export type RootProps = {
  rootAlias?: string;
  rootDisplay?: string;
  rootVisible?: boolean;
};

// export type SubgroupProps<T extends keyof ConfigSchemas.Config> = {
//   rootAlias?: string;
//   rootDisplay?: string;
//   rootVisible?: boolean;
//   commandAlias?: (value: ConfigSchemas.Config[T]) => string;
//   commandDisplay?: (value: ConfigSchemas.Config[T]) => string;
//   commandConfigValueMode?: (
//     value: ConfigSchemas.Config[T]
//   ) => "include" | undefined;
//   isCommandVisible?: (value: ConfigSchemas.Config[T]) => boolean;
//   isCommandAvailable?: (
//     value: ConfigSchemas.Config[T]
//   ) => (() => boolean) | undefined;
//   commandCustomData?: (
//     value: ConfigSchemas.Config[T]
//   ) => Record<string, string | boolean>;
//   hover?: (value: ConfigSchemas.Config[T]) => void;
//   afterExec?: (value: ConfigSchemas.Config[T]) => void;
//   options: "fromSchema" | ConfigSchemas.Config[T][];
// };

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
} & (ConfigSchemas.Config[T] extends string
  ? {
      /**
      optional converter, e.g. if the config value contains undersores but we want to show spaces to the user
      */
      inputValueConvert?: (val: string) => ConfigSchemas.Config[T];
    }
  : {
      inputValueConvert: (val: string) => ConfigSchemas.Config[T];
    });

export type SubgroupMeta<T extends keyof ConfigSchemas.Config> = {
  type: "subgroup";
  subgroup: SubgroupProps<T>;
} & RootProps;

type InputMeta<T extends keyof ConfigSchemas.Config> = {
  type: "input";
  input?: InputProps<T>;
} & RootProps;

type SubgroupWithInputMeta<T extends keyof ConfigSchemas.Config> = {
  type: "subgroupWithInput";
  input: InputProps<T> & { configValue?: ConfigSchemas.Config[T] };
  subgroup: SubgroupProps<T>;
} & RootProps;

type SubgroupWithSecondKeyInputMeta<
  T extends keyof ConfigSchemas.Config,
  T2 extends keyof ConfigSchemas.Config
> = {
  type: "subgroupWithSecondKeyInput";
  input: InputProps<T2> & {
    configValue?: ConfigSchemas.Config[T2];
    secondKey: T2;
  };
  subgroup: SubgroupProps<T>;
} & RootProps;

export const commandlineConfigMetadata: CommandlineConfigMetadataObject = {
  //test
  punctuation: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  numbers: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  words: {
    type: "subgroupWithInput",
    rootAlias: "words",
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
    type: "subgroupWithInput",
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
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        ManualRestart.set();
        TestLogic.restart();
      },
    },
  },
  quoteLength: {
    type: "subgroup",
    rootAlias: "quotes",
    subgroup: {
      options: [[0, 1, 2, 3], [0], [1], [2], [3], [-3]],
      commandConfigValueMode: () => "include",
      isCommandAvailable: (value) => {
        if (value[0] === -3) {
          return isAuthenticated;
        }
        return undefined;
      },
      commandDisplay: (value) => {
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
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      commandDisplay: (value) => {
        return getLanguageDisplayString(value);
      },
    },
  },
  //behavior
  difficulty: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  quickRestart: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  repeatQuotes: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  blindMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  alwaysShowWordsHistory: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  singleListCommandLine: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  minWpm: {
    type: "subgroupWithSecondKeyInput",
    rootDisplay: "Minimum speed...",
    rootAlias: "wpm",
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
    type: "subgroupWithSecondKeyInput",
    rootDisplay: "Minimum accuracy...",
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
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        TestLogic.restart();
      },
    },
  },
  // funbox: null,
  customLayoutfluid: {
    type: "input",
    input: {
      defaultValue: () => {
        return Config.customLayoutfluid.join(" ");
      },
      inputValueConvert: (val) =>
        val.trim().split(" ") as ConfigSchemas.CustomLayoutFluid,
    },
  },
  customPolyglot: {
    type: "input",
    input: {
      defaultValue: () => {
        return Config.customPolyglot.join(" ");
      },
      inputValueConvert: (val) =>
        val.trim().split(" ") as ConfigSchemas.CustomPolyglot,
      afterExec: () => {
        if (ActivePage.get() === "test") {
          TestLogic.restart();
        }
      },
    },
  },
  //input
  freedomMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  strictSpace: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  oppositeShiftMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      afterExec: () => {
        void ModesNotice.update();
      },
    },
  },
  stopOnError: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  confidenceMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  quickEnd: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  indicateTypos: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  hideExtraLetters: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  lazyMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  layout: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      commandDisplay: (layout) =>
        layout === "default" ? "off" : layout.replace(/_/g, " "),
      afterExec: () => TestLogic.restart(),
    },
  },
  codeUnindentOnBackspace: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  //sound
  soundVolume: {
    type: "subgroupWithInput",
    subgroup: {
      options: [0.1, 0.5, 1],
      commandDisplay: (val) =>
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
    type: "subgroup",
    rootAlias: "play",
    rootDisplay: "Sound on click...",
    subgroup: {
      options: "fromSchema",
      commandDisplay: (value) => {
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
    type: "subgroup",
    rootAlias: "play",
    rootDisplay: "Sound on error...",
    subgroup: {
      options: "fromSchema",
      commandDisplay: (value) => {
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
    type: "subgroup",
    rootAlias: "sound",
    subgroup: {
      options: "fromSchema",
      commandDisplay: (value) => {
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
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  caretStyle: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      isCommandVisible: (value) => !["banana", "carrot"].includes(value),
    },
  },
  paceCaret: {
    type: "subgroupWithSecondKeyInput",
    rootDisplay: "Pace caret mode...",
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
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  paceCaretStyle: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      isCommandVisible: (value) => !["banana", "carrot"].includes(value),
    },
  },

  //appearence
  timerStyle: {
    type: "subgroup",
    subgroup: { options: "fromSchema" },
    rootAlias: "timer",
  },
  liveSpeedStyle: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootAlias: "wpm",
  },
  liveAccStyle: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootAlias: "wpm",
  },
  liveBurstStyle: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootAlias: "wpm",
  },
  timerColor: {
    type: "subgroup",
    rootAlias: "timer speed wpm burst acc",
    subgroup: {
      options: "fromSchema",
      commandAlias: () => "timer",
    },
  },
  timerOpacity: {
    type: "subgroup",
    rootAlias: "timer speed wpm burst acc",
    subgroup: {
      options: "fromSchema",
      commandAlias: () => "timer",
    },
  },
  highlightMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  tapeMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  tapeMargin: {
    type: "input",
    input: {
      inputValueConvert: Number,
    },
  },
  smoothLineScroll: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  showAllLines: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  typingSpeedUnit: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      isCommandVisible: (val) => val !== "wph",
    },
  },
  alwaysShowDecimalPlaces: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  startGraphsAtZero: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  maxLineWidth: {
    type: "input",
    input: {
      alias: "page",
      inputValueConvert: Number,
    },
  },
  fontSize: {
    type: "input",
    input: {
      inputValueConvert: Number,
    },
  },
  fontFamily: {
    type: "subgroupWithInput",
    subgroup: {
      options: typedKeys(Fonts).sort(),
      commandDisplay: (name) =>
        Fonts[name as KnownFontName]?.display ?? name.replaceAll(/_/g, " "),
      commandCustomData: (name) => {
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
    input: {
      inputValueConvert: (name) => name.replaceAll(/ /g, "_"),
      defaultValue: () => Config.fontFamily.replace(/_/g, " "),
      hover: (): void => {
        UI.clearFontPreview();
      },
    },
  },
  keymapMode: {
    type: "subgroup",
    rootAlias: "keyboard",
    subgroup: {
      options: "fromSchema",
      commandAlias: (val) => (val === "react" ? "flash" : ""),
    },
  },
  keymapStyle: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootAlias: "keyboard",
  },
  keymapLegendStyle: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootAlias: "keyboard",
  },
  keymapSize: {
    type: "input",
    input: {
      alias: "keyboard",
      inputValueConvert: Number,
    },
  },
  keymapLayout: {
    type: "subgroup",
    rootAlias: "keyboard",
    subgroup: {
      options: "fromSchema",
      commandAlias: (val) => (val === "overrideSync" ? "default" : ""),
      commandDisplay: (layout) =>
        layout === "overrideSync" ? "emulator sync" : layout.replace(/_/g, " "),
      afterExec: () => TestLogic.restart(),
    },
  },
  keymapShowTopRow: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootAlias: "keyboard",
  },

  //themes
  customTheme: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  flipTestColors: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  colorfulMode: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  customBackground: {
    type: "input",
  },
  customBackgroundSize: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  randomTheme: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
      isCommandAvailable: (value) =>
        value === "custom" ? isAuthenticated : undefined,
    },
  },

  //showhide
  showKeyTips: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootDisplay: "Key tips...",
  },
  showOutOfFocusWarning: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
    rootDisplay: "Out of focus warning...",
  },
  capsLockWarning: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  showAverage: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
  monkeyPowerLevel: {
    type: "subgroup",
    rootAlias: "powermode",
    rootVisible: false,
    subgroup: {
      options: "fromSchema",
      commandDisplay: (value) => {
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
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },

  //danger zone
  ads: {
    type: "subgroup",
    subgroup: {
      options: "fromSchema",
    },
  },
};
