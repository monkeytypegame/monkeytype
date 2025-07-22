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
  playTimeWarning: {
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
