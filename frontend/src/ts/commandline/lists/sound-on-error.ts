import * as UpdateConfig from "../../config";
import * as SoundController from "../../controllers/sound-controller";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Sound on error...",
  configKey: "playSoundOnError",
  list: [
    {
      id: "setPlaySoundOnErrorOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError(false);
      },
    },
    {
      id: "setPlaySoundOnErrorOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError(true);
        SoundController.playError();
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeSoundOnError",
    display: "Sound on error...",
    icon: "fa-volume-mute",
    subgroup,
  },
];

export default commands;
