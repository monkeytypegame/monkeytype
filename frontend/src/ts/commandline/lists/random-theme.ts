import * as UpdateConfig from "../../config";
import { isAuthenticated } from "../../firebase";
import * as Notifications from "../../elements/notifications";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Random theme...",
  configKey: "randomTheme",
  list: [
    {
      id: "setRandomOff",
      display: "off",
      configValue: "off",
      exec: (): void => {
        UpdateConfig.setRandomTheme("off");
      },
    },
    {
      id: "setRandomOn",
      display: "on",
      configValue: "on",
      exec: (): void => {
        UpdateConfig.setRandomTheme("on");
      },
    },
    {
      id: "setRandomFav",
      display: "fav",
      configValue: "fav",
      exec: (): void => {
        UpdateConfig.setRandomTheme("fav");
      },
    },
    {
      id: "setRandomLight",
      display: "light",
      configValue: "light",
      exec: (): void => {
        UpdateConfig.setRandomTheme("light");
      },
    },
    {
      id: "setRandomDark",
      display: "dark",
      configValue: "dark",
      exec: (): void => {
        UpdateConfig.setRandomTheme("dark");
      },
    },
    {
      id: "setRandomCustom",
      display: "custom",
      configValue: "custom",
      exec: (): void => {
        if (!isAuthenticated()) {
          Notifications.add(
            "Multiple custom themes are available to logged in users only",
            0
          );
          return;
        }
        UpdateConfig.setRandomTheme("custom");
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeRandomTheme",
    display: "Random theme...",
    icon: "fa-random",
    subgroup,
  },
];

export default commands;
