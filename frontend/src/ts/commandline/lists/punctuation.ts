import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";

const commands: MonkeyTypes.Command[] = [
  {
    id: "changePunctuation",
    display: "Punctuation...",
    icon: "fa-at",
    subgroup: {
      title: "Change punctuation...",
      configKey: "punctuation",
      list: [
        {
          id: "changePunctuationOn",
          display: "on",
          configValue: true,
          exec: (): void => {
            UpdateConfig.setPunctuation(true);
            TestLogic.restart();
          },
        },
        {
          id: "changePunctuationOff",
          display: "off",
          configValue: false,
          exec: (): void => {
            UpdateConfig.setPunctuation(false);
            TestLogic.restart();
          },
        },
      ],
    },
  },
];

export default commands;
