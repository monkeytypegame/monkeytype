import { configMetadata, ConfigMetadata } from "../config-metadata";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import * as SoundController from "../controllers/sound-controller";

type CommandlineConfigMetadata = {
  [K in keyof ConfigSchemas.Config]?: ConfigMetadata<K> & {
    rootAlias?: string;
    rootDisplay?: string;
    commandAlias?: (value: ConfigSchemas.Config[K]) => string;
    commandDisplay?: (value: ConfigSchemas.Config[K]) => string;
    afterExec?: (value: ConfigSchemas.Config[K]) => void;
  };
};

export const commandlineConfigMetadata: CommandlineConfigMetadata = {
  //sound
  playTimeWarning: {
    ...configMetadata.playTimeWarning,
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
