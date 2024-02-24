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
        void SoundController.previewClick("1");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("1");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick2",
      display: "beep",
      configValue: "2",
      hover: (): void => {
        void SoundController.previewClick("2");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("2");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick3",
      display: "pop",
      configValue: "3",
      hover: (): void => {
        void SoundController.previewClick("3");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("3");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick4",
      display: "nk creams",
      configValue: "4",
      hover: (): void => {
        void SoundController.previewClick("4");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("4");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick5",
      display: "typewriter",
      configValue: "5",
      hover: (): void => {
        void SoundController.previewClick("5");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("5");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick6",
      display: "osu",
      configValue: "6",
      hover: (): void => {
        void SoundController.previewClick("6");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("6");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick7",
      display: "hitmarker",
      configValue: "7",
      hover: (): void => {
        void SoundController.previewClick("7");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("7");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick8",
      display: "sine",
      configValue: "8",
      hover: (): void => {
        SoundController.playNote("KeyQ", "sine");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("8");
        SoundController.playNote("KeyQ", "sine");
      },
    },
    {
      id: "setSoundOnClick9",
      display: "sawtooth",
      configValue: "9",
      hover: (): void => {
        SoundController.playNote("KeyQ", "sawtooth");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("9");
        SoundController.playNote("KeyQ", "sawtooth");
      },
    },
    {
      id: "setSoundOnClick10",
      display: "square",
      configValue: "10",
      hover: (): void => {
        SoundController.playNote("KeyQ", "square");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("10");
        SoundController.playNote("KeyQ", "square");
      },
    },
    {
      id: "setSoundOnClick11",
      display: "triangle",
      configValue: "11",
      hover: (): void => {
        SoundController.playNote("KeyQ", "triangle");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("11");
        SoundController.playNote("KeyQ", "triangle");
      },
    },
    {
      id: "setSoundOnClick12",
      display: "pentatonic",
      configValue: "12",
      hover: (): void => {
        SoundController.scaleConfigurations["12"].preview();
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("12");
        SoundController.scaleConfigurations["12"].preview();
      },
    },
    {
      id: "setSoundOnClick13",
      display: "wholetone",
      configValue: "13",
      hover: (): void => {
        SoundController.scaleConfigurations["13"].preview();
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("13");
        SoundController.scaleConfigurations["13"].preview();
      },
    },
    {
      id: "setSoundOnClick14",
      display: "fist fight",
      configValue: "14",
      hover: (): void => {
        void SoundController.previewClick("14");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("14");
        void SoundController.playClick();
      },
    },
    {
      id: "setSoundOnClick15",
      display: "rubber keys",
      configValue: "15",
      hover: (): void => {
        void SoundController.previewClick("15");
      },
      exec: (): void => {
        UpdateConfig.setPlaySoundOnClick("15");
        void SoundController.playClick();
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
