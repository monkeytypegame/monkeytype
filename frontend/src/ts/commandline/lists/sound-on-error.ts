import * as UpdateConfig from "../../config";
import * as SoundController from "../../controllers/sound-controller";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Sound on error...",
  configKey: "playSoundOnError",
  list: [
    {
      id: "setPlaySoundOnErrorOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError("off");
      },
    },
    {
      id: "setPlaySoundOnError1",
      display: "damage",
      configValue: "1",
      hover: (): void => {
        void SoundController.previewError("1");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError("1");
        void SoundController.playError();
      },
    },
    {
      id: "setPlaySoundOnError2",
      display: "triangle",
      configValue: "2",
      hover: (): void => {
        void SoundController.previewError("2");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError("2");
        void SoundController.playError();
      },
    },
    {
      id: "setPlaySoundOnError3",
      display: "square",
      configValue: "3",
      hover: (): void => {
        void SoundController.previewError("3");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError("3");
        void SoundController.playError();
      },
    },
    {
      id: "setPlaySoundOnError3",
      display: "punch miss",
      configValue: "4",
      hover: (): void => {
        void SoundController.previewError("4");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnError("4");
        void SoundController.playError();
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
