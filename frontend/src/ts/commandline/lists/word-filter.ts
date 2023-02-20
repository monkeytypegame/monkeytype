import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Word Filter...",
  configKey: "wordFilter",
  list: [
    {
      id: "setWordFilterOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setWordFilter("off");
        console.log("off");
      },
    },
    {
      id: "setWordFilterLeft",
      display: "letter",
      configValue: "letter",
      exec: (): void => {
        UpdateConfig.setWordFilter("left");
        console.log("left");
      },
    },
    {
      id: "setWordFilterRight",
      display: "word",
      configValue: "word",
      exec: (): void => {
        UpdateConfig.setWordFilter("right");
        console.log("right");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeWordFilter",
    display: "Word Filter...",
    icon: "fa-tape",
    subgroup,
  },
];

export default commands;
