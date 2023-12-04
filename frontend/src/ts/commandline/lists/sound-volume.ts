import Config, * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Sound volume...",
  configKey: "soundVolume",
  list: [
    {
      id: "setSoundVolume",
      display: "volume...",
      input: true,
      defaultValue: (): string => {
        return Config.soundVolume.toString();
      },
      exec: (input): void => {
        if(!input) return;
        let newVolume = Config.soundVolume;
        newVolume = parseFloat(input);
        UpdateConfig.setSoundVolume(newVolume);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "setSoundVolume",
    display: "Sound volume...",
    icon: "fa-volume-down",
    subgroup,
  },
];

export default commands;
