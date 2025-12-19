import Config from "../../config";
import * as CustomText from "../../test/custom-text";
import * as TestLogic from "../../test/test-logic";
import * as TestState from "../../test/test-state";
import * as CustomTextState from "../../states/custom-text-name";
import { Command, CommandsSubgroup } from "../types";

function canBailOut(): boolean {
  return (
    (Config.mode === "custom" && CustomTextState.isCustomTextLong() === true) ||
    (Config.mode === "custom" &&
      (CustomText.getLimitMode() === "word" ||
        CustomText.getLimitMode() === "section") &&
      (CustomText.getLimit().value >= 5000 ||
        CustomText.getLimit().value === 0)) ||
    (Config.mode === "custom" &&
      CustomText.getLimitMode() === "time" &&
      (CustomText.getLimitValue() >= 3600 ||
        CustomText.getLimitValue() === 0)) ||
    (Config.mode === "words" && Config.words >= 5000) ||
    Config.words === 0 ||
    (Config.mode === "time" && (Config.time >= 3600 || Config.time === 0)) ||
    Config.mode === "zen"
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
        TestState.setBailedOut(true);
        void TestLogic.finish();
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
    icon: "fa-running",
    subgroup,
    visible: false,
    available: (): boolean => {
      return canBailOut();
    },
  },
];

export default commands;
