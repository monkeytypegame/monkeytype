import * as UpdateConfig from "../../config";
import * as SoundController from "../../controllers/sound-controller";

const commands: MonkeyTypes.CommandsSubgroup = {
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

export default commands;
