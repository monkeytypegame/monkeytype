import * as UpdateConfig from "../../config";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Always show decimal places...",
  configKey: "alwaysShowDecimalPlaces",
  list: [
    {
      id: "setAlwaysShowDecimalPlacesOff",
      display: "off",
      configValue: false,
      exec: (): void => {
        UpdateConfig.setAlwaysShowDecimalPlaces(false);
      },
    },
    {
      id: "setAlwaysShowDecimalPlacesOn",
      display: "on",
      configValue: true,
      exec: (): void => {
        UpdateConfig.setAlwaysShowDecimalPlaces(true);
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeAlwaysShowDecimal",
    display: "Always show decimal places...",
    icon: "00",
    subgroup,
  },
];

export default commands;
