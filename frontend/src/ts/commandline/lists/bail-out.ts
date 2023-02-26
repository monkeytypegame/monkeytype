import Config from "../../config";
import * as CustomText from "../../test/custom-text";
import * as TestLogic from "../../test/test-logic";
import * as TestInput from "../../test/test-input";
import * as CustomTextState from "../../states/custom-text-name";

function canBailOut(): boolean {
  return (
    (Config.mode === "custom" && CustomTextState.isCustomTextLong() === true) ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      (CustomText.word >= 5000 || CustomText.word === 0)) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.text.length >= 5000) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      (CustomText.time >= 3600 || CustomText.time === 0)) ||
    (Config.mode === "words" && Config.words >= 5000) ||
    Config.words === 0 ||
    (Config.mode === "time" && (Config.time >= 3600 || Config.time === 0)) ||
    Config.mode === "zen"
  );
}

const subgroup: MonkeyTypes.CommandsSubgroup = {
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
        TestInput.setBailout(true);
        TestLogic.finish();
      },
      available: (): boolean => {
        return canBailOut();
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
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
