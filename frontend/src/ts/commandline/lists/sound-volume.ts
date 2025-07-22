import { SoundVolumeSchema } from "@monkeytype/schemas/configs";
import * as UpdateConfig from "../../config";
import * as SoundController from "../../controllers/sound-controller";
import { Command, CommandsSubgroup, withValidation } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Sound volume...",
  configKey: "soundVolume",
  list: [
    {
      id: "setSoundVolume0.1",
      display: "quiet",
      configValue: "0.1",
      exec: (): void => {
        UpdateConfig.setSoundVolume(0.1);
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundVolume0.5",
      display: "medium",
      configValue: "0.5",
      exec: (): void => {
        UpdateConfig.setSoundVolume(0.5);
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundVolume1.0",
      display: "loud",
      configValue: "1.0",
      exec: (): void => {
        UpdateConfig.setSoundVolume(1.0);
        void SoundController.playClick();
      },
    },
    withValidation({
      id: "setSoundVolumeCustom",
      display: "custom...",
      input: true,
      inputValueConvert: Number,
      validation: { schema: SoundVolumeSchema },
      exec: ({ input }): void => {
        if (input === undefined) return;
        UpdateConfig.setSoundVolume(input);
        void SoundController.playClick();
      },
    }),
  ],
};

const commands: Command[] = [
  {
    id: "changeSoundVolume",
    display: "Sound volume...",
    icon: "fa-volume-down",
    subgroup,
  },
];

export default commands;
