import { getConfig } from "../../config/store";
import { getCustomTextIndicator } from "../../states/core";
import * as CustomText from "../../test/custom-text";
import * as TestLogic from "../../test/test-logic";
import { Command, CommandsSubgroup } from "../types";

function canBailOut(): boolean {
  return (
    (getConfig.mode === "custom" &&
      getCustomTextIndicator()?.isLong === true) ||
    (getConfig.mode === "custom" &&
      (CustomText.getLimitMode() === "word" ||
        CustomText.getLimitMode() === "section") &&
      (CustomText.getLimit().value >= 5000 ||
        CustomText.getLimit().value === 0)) ||
    (getConfig.mode === "custom" &&
      CustomText.getLimitMode() === "time" &&
      (CustomText.getLimitValue() >= 3600 ||
        CustomText.getLimitValue() === 0)) ||
    (getConfig.mode === "words" && getConfig.words >= 5000) ||
    getConfig.words === 0 ||
    (getConfig.mode === "time" &&
      (getConfig.time >= 3600 || getConfig.time === 0)) ||
    getConfig.mode === "zen"
  );
}

const subgroup: CommandsSubgroup = {
  title: "Are you sure...",
  list: [
    {
      id: "bailOutNo",
      display: "Nevermind",
      available: (): boolean => {
        return canBailOut();
      },
    },
    {
      id: "bailOutForSure",
      display: "Yes, I am sure",
      exec: (): void => {
        TestLogic.finish({ type: "bailedOut" });
      },
      available: (): boolean => {
        return canBailOut();
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "bailOut",
    display: "Bail out...",
    fa: { icon: "fa-running" },
    subgroup,
    visible: false,
    available: (): boolean => {
      return canBailOut();
    },
  },
];

export default commands;
