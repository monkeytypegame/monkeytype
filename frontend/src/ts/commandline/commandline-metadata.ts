import * as ConfigSchemas from "@monkeytype/schemas/configs";
import * as SoundController from "../controllers/sound-controller";
import * as TestLogic from "../test/test-logic";
import { getLanguageDisplayString } from "../utils/strings";
import * as ModesNotice from "../elements/modes-notice";
import { ZodSchema } from "zod";

//todo: remove ? here to require all config keys to be defined
type CommandlineConfigMetadataObject = {
  [K in keyof ConfigSchemas.Config]?: CommandlineConfigMetadata<K>;
};

// export type CommandlineConfigMetadata<T extends keyof ConfigSchemas.Config> = {
//   rootAlias?: string;
//   rootDisplay?: string;
//   commandAlias?: (value: ConfigSchemas.Config[T]) => string;
//   commandDisplay?: (value: ConfigSchemas.Config[T]) => string;
//   isCommandVisible?: (value: ConfigSchemas.Config[T]) => boolean;
//   hover?: (value: ConfigSchemas.Config[T]) => void;
//   afterExec?: (value: ConfigSchemas.Config[T]) => void;
// };

export type CommandlineConfigMetadata<T extends keyof ConfigSchemas.Config> =
  | SubgroupMeta<T>
  | InputMeta<T>
  | SubgroupWithInputMeta<T>
  | SubgroupWithSecondKeyInputMeta<T>
  | null;

type SubgroupProps<T extends keyof ConfigSchemas.Config> = {
  rootAlias?: string;
  rootDisplay?: string;
  commandAlias?: (value: ConfigSchemas.Config[T]) => string;
  commandDisplay?: (value: ConfigSchemas.Config[T]) => string;
  isCommandVisible?: (value: ConfigSchemas.Config[T]) => boolean;
  hover?: (value: ConfigSchemas.Config[T]) => void;
  afterExec?: (value: ConfigSchemas.Config[T]) => void;
  options: "fromSchema" | ConfigSchemas.Config[T][];
};

type InputProps<T extends keyof ConfigSchemas.Config> = {
  alias: string;
  display: string;
  validation: {
    schema: ZodSchema;
    isValid: (value: ConfigSchemas.Config[T]) => boolean;
  };
  inputValueConvert: (value: string) => ConfigSchemas.Config[T];
};

type SubgroupMeta<T extends keyof ConfigSchemas.Config> = {
  type: "subgroup";
} & SubgroupProps<T>;

type InputMeta<T extends keyof ConfigSchemas.Config> = {
  type: "input";
} & InputProps<T>;

type SubgroupWithInputMeta<T extends keyof ConfigSchemas.Config> = {
  type: "subgroupWithInput";
  input: InputProps<T>;
} & SubgroupProps<T>;

type SubgroupWithSecondKeyInputMeta<T extends keyof ConfigSchemas.Config> = {
  type: "subgroupWithSecondKeyInput";
  input: InputProps<T> & {
    secondKey: keyof ConfigSchemas.Config;
  };
} & SubgroupProps<T>;

export const commandlineConfigMetadata: CommandlineConfigMetadataObject = {
  //test
  punctuation: {
    type: "subgroup",
    options: "fromSchema",
    afterExec: () => {
      TestLogic.restart();
    },
  },
  numbers: {
    type: "subgroup",
    options: "fromSchema",
    afterExec: () => {
      TestLogic.restart();
    },
  },
  words: null,
  time: null,
  mode: null,
  quoteLength: null,
  language: {
    type: "subgroup",
    options: "fromSchema",
    commandDisplay: (value) => {
      return getLanguageDisplayString(value);
    },
  },
  burstHeatmap: null,
  //behavior
  difficulty: {
    type: "subgroup",
    options: "fromSchema",
  },
  quickRestart: {
    type: "subgroup",
    options: "fromSchema",
  },
  repeatQuotes: {
    type: "subgroup",
    options: "fromSchema",
  },
  blindMode: {
    type: "subgroup",
    options: "fromSchema",
  },
  alwaysShowWordsHistory: {
    type: "subgroup",
    options: "fromSchema",
  },
  singleListCommandLine: {
    type: "subgroup",
    options: "fromSchema",
  },
  minWpm: null,
  minAcc: null,
  minBurst: null,
  britishEnglish: {
    type: "subgroup",
    options: "fromSchema",
    afterExec: () => {
      TestLogic.restart();
    },
  },
  funbox: null,
  //input
  freedomMode: {
    type: "subgroup",
    options: "fromSchema",
  },
  strictSpace: {
    type: "subgroup",
    options: "fromSchema",
  },
  oppositeShiftMode: {
    type: "subgroup",
    options: "fromSchema",
    afterExec: () => {
      void ModesNotice.update();
    },
  },
  stopOnError: {
    type: "subgroup",
    options: "fromSchema",
  },
  confidenceMode: {
    type: "subgroup",
    options: "fromSchema",
  },
  quickEnd: {
    type: "subgroup",
    options: "fromSchema",
  },
  indicateTypos: {
    type: "subgroup",
    options: "fromSchema",
  },
  hideExtraLetters: {
    type: "subgroup",
    options: "fromSchema",
  },
  lazyMode: {
    type: "subgroup",
    options: "fromSchema",
  },
  codeUnindentOnBackspace: {
    type: "subgroup",
    options: "fromSchema",
  },
  //sound
  playSoundOnClick: {
    type: "subgroup",
    options: "fromSchema",
    rootAlias: "play",
    rootDisplay: "Sound on click...",
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
  playSoundOnError: {
    type: "subgroup",
    options: "fromSchema",
    rootAlias: "play",
    rootDisplay: "Sound on error...",
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
  playTimeWarning: {
    type: "subgroup",
    options: "fromSchema",
    rootAlias: "sound",
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
  //caret
  smoothCaret: {
    type: "subgroup",
    options: "fromSchema",
  },
  caretStyle: {
    type: "subgroup",
    options: "fromSchema",
    isCommandVisible: (value) => !["banana", "carrot"].includes(value),
  },
  repeatedPace: {
    type: "subgroup",
    options: "fromSchema",
  },
  paceCaretStyle: {
    type: "subgroup",
    options: "fromSchema",
    isCommandVisible: (value) => !["banana", "carrot"].includes(value),
  },

  //appearence
  timerStyle: { type: "subgroup", options: "fromSchema", rootAlias: "timer" },
  liveSpeedStyle: { type: "subgroup", options: "fromSchema", rootAlias: "wpm" },
  liveAccStyle: { type: "subgroup", options: "fromSchema", rootAlias: "wpm" },
  liveBurstStyle: { type: "subgroup", options: "fromSchema", rootAlias: "wpm" },
  timerColor: {
    type: "subgroup",
    options: "fromSchema",
    rootAlias: "timer speed wpm burst acc",
    commandAlias: () => "timer",
  },
  timerOpacity: {
    type: "subgroup",
    options: "fromSchema",
    rootAlias: "timer speed wpm burst acc",
    commandAlias: () => "timer",
  },
  highlightMode: {
    type: "subgroup",
    options: "fromSchema",
  },
  tapeMode: {
    type: "subgroup",
    options: "fromSchema",
  },
};
