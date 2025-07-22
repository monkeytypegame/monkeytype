import * as ConfigSchemas from "@monkeytype/schemas/configs";
import * as SoundController from "../controllers/sound-controller";
import * as TestLogic from "../test/test-logic";
import { getLanguageDisplayString } from "../utils/strings";

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
  language: {
    commandDisplay: (value) => {
      return getLanguageDisplayString(value);
    },
  },
  //behavior
  difficulty: {},
  quickRestart: {},
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
};
