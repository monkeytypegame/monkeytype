import * as ConfigSchemas from "@monkeytype/schemas/configs";
import * as SoundController from "../controllers/sound-controller";
import * as TestLogic from "../test/test-logic";
import { getLanguageDisplayString } from "../utils/strings";
import * as ModesNotice from "../elements/modes-notice";

//todo: remove ? here to require all config keys to be defined
type CommandlineConfigMetadata = {
  [K in keyof ConfigSchemas.Config]?: {
    rootAlias?: string;
    rootDisplay?: string;
    commandAlias?: (value: ConfigSchemas.Config[K]) => string;
    commandDisplay?: (value: ConfigSchemas.Config[K]) => string;
    hover?: (value: ConfigSchemas.Config[K]) => void;
    afterExec?: (value: ConfigSchemas.Config[K]) => void;
  };
};

export const commandlineConfigMetadata: CommandlineConfigMetadata = {
  //test
  punctuation: {
    afterExec: () => {
      TestLogic.restart();
    },
  },
  numbers: {
    afterExec: () => {
      TestLogic.restart();
    },
  },
  words: {},
  time: {},
  mode: {},
  quoteLength: {},
  language: {
    commandDisplay: (value) => {
      return getLanguageDisplayString(value);
    },
  },
  burstHeatmap: {},
  //behavior
  difficulty: {},
  quickRestart: {},
  repeatQuotes: {},
  blindMode: {},
  alwaysShowWordsHistory: {},
  singleListCommandLine: {},
  minWpm: {},
  minAcc: {},
  minBurst: {},
  britishEnglish: {
    afterExec: () => {
      TestLogic.restart();
    },
  },
  funbox: {},
  //sound
  playSoundOnClick: {
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
  //input
  freedomMode: {},
  strictSpace: {},
  oppositeShiftMode: {
    afterExec: () => {
      void ModesNotice.update();
    },
  },
  stopOnError: {},
  confidenceMode: {},
  quickEnd: {},
  indicateTypos: {},
  hideExtraLetters: {},
  lazyMode: {},
  codeUnindentOnBackspace: {},
};
