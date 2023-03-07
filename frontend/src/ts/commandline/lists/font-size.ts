import Config, * as UpdateConfig from "../../config";
import * as TestUI from "../../test/test-ui";

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeFontSize",
    display: "Font size...",
    icon: "fa-font",
    input: true,
    defaultValue: (): string => {
      return Config.fontSize.toString();
    },
    exec: (input): void => {
      if (!input) return;
      UpdateConfig.setFontSize(parseFloat(input));
      setTimeout(() => {
        TestUI.updateWordsHeight(true);
      }, 0); //honestly no clue why it i need to wait for the next event loop to do this
    },
  },
];
export default commands;
