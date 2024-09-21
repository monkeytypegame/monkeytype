import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Set enable ads...",
  configKey: "ads",
  list: [
    {
      id: "setEnableAdsOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setAds("off");
      },
    },
    {
      id: "setEnableAdsOn",
      display: "result",
      configValue: "result",
      exec: (): void => {
        UpdateConfig.setAds("result");
      },
    },
    {
      id: "setEnableOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setAds("on");
      },
    },
    {
      id: "setEnableSellout",
      display: "sellout",
      configValue: "sellout",
      exec: (): void => {
        UpdateConfig.setAds("sellout");
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "setEnableAds",
    display: "Enable ads...",
    icon: "fa-ad",
    subgroup,
  },
];

export default commands;
