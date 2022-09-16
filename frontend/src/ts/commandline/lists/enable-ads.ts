import * as UpdateConfig from "../../config";

export const commands: MonkeyTypes.CommandsSubgroup = {
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

export default commands;
