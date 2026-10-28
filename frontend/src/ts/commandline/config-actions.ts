import * as ConfigSchemas from "@monkeytype/schemas/configs";
import * as SoundController from "../controllers/sound-controller";
import * as TestLogic from "../test/test-logic";
import { getRoutePage } from "../states/router";
import { setFontPreview } from "../states/font";

// side effects of config commands, kept out of config metadata because the
// modules they call import the config setters (a circular import otherwise).
// the test restarts go away once the engine restarts on `changeRequiresRestart`

export type CommandlineConfigActions<K extends keyof ConfigSchemas.Config> = {
  subgroup?: {
    afterExec?: (value: ConfigSchemas.Config[K]) => void;
    hover?: (value: ConfigSchemas.Config[K]) => void;
  };
  input?: {
    afterExec?: () => void;
    hover?: () => void;
  };
};

type CommandlineConfigActionsObject = {
  [K in keyof ConfigSchemas.Config]?: CommandlineConfigActions<K>;
};

const restart = (): void => {
  void TestLogic.restartTest();
};

export const commandlineConfigActions: CommandlineConfigActionsObject = {
  //test
  punctuation: {
    subgroup: { afterExec: restart },
  },
  numbers: {
    subgroup: { afterExec: restart },
  },
  words: {
    subgroup: { afterExec: restart },
    input: { afterExec: restart },
  },
  time: {
    subgroup: { afterExec: restart },
    input: { afterExec: restart },
  },
  mode: {
    subgroup: { afterExec: restart },
  },
  quoteLength: {
    subgroup: { afterExec: restart },
  },
  britishEnglish: {
    subgroup: { afterExec: restart },
  },
  customPolyglot: {
    input: {
      afterExec: () => {
        if (getRoutePage() === "test") {
          restart();
        }
      },
    },
  },
  //input
  lazyMode: {
    subgroup: { afterExec: restart },
  },
  layout: {
    subgroup: { afterExec: restart },
  },
  //sound
  soundVolume: {
    subgroup: {
      afterExec: () => SoundController.playClick,
    },
  },
  playSoundOnClick: {
    subgroup: {
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
    subgroup: {
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
    subgroup: {
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
  paceCaret: {
    subgroup: { afterExec: restart },
    input: { afterExec: restart },
  },
  //appearance
  fontFamily: {
    subgroup: {
      hover: (name) => setFontPreview(name),
    },
  },
  keymapLayout: {
    subgroup: { afterExec: restart },
  },
};
