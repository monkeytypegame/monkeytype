import * as UpdateConfig from "../../config";
import * as SoundController from "../../controllers/sound-controller";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Sound on click...",
  configKey: "playSoundOnClick",
  list: [
    {
      id: "setSoundOnClickOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("off");
      },
    },
    {
      id: "setSoundOnClick1",
      display: "click",
      configValue: "1",
      hover: (): void => {
        SoundController.previewClick("1");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("1");
        SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick2",
      display: "beep",
      configValue: "2",
      hover: (): void => {
        SoundController.previewClick("2");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("2");
        SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick3",
      display: "pop",
      configValue: "3",
      hover: (): void => {
        SoundController.previewClick("3");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("3");
        SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick4",
      display: "nk creams",
      configValue: "4",
      hover: (): void => {
        SoundController.previewClick("4");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("4");
        SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick5",
      display: "typewriter",
      configValue: "5",
      hover: (): void => {
        SoundController.previewClick("5");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("5");
        SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick6",
      display: "osu",
      configValue: "6",
      hover: (): void => {
        SoundController.previewClick("6");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("6");
        SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick7",
      display: "hitmarker",
      configValue: "7",
      hover: (): void => {
        SoundController.previewClick("7");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("7");
        SoundController.playClick();
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeSoundOnClick",
    display: "Sound on click...",
    icon: "fa-volume-up",
    subgroup,
  },
];

export default commands;
