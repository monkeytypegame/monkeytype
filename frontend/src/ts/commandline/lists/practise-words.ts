import * as PractiseWords from "../../test/practise-words";
import * as TestLogic from "../../test/test-logic";
import * as TestUI from "../../test/test-ui";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Practice words...",
  list: [
    {
      id: "practiseWordsMissed",
      display: "missed",
      noIcon: true,
      exec: (): void => {
        PractiseWords.init(true, false);
        TestLogic.restart({
          practiseMissed: true,
        });
      },
    },
    {
      id: "practiseWordsSlow",
      display: "slow",
      noIcon: true,
      exec: (): void => {
        PractiseWords.init(false, true);
        TestLogic.restart({
          practiseMissed: true,
        });
      },
    },
    {
      id: "practiseWordsBoth",
      display: "both",
      noIcon: true,
      exec: (): void => {
        PractiseWords.init(true, true);
        TestLogic.restart({
          practiseMissed: true,
        });
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "practiseWords",
    display: "Practice words...",
    icon: "fa-exclamation-triangle",
    subgroup,
    available: (): boolean => {
      return TestUI.resultVisible;
    },
  },
];

export default commands;
