import * as TestState from "../../test/test-state";
import * as ModesNotice from "../../elements/modes-notice";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Result saving...",
  list: [
    {
      id: "setResultSavingOff",
      display: "off",
      alias: "disabled incognito",
      exec: (): void => {
        TestState.setSaving(false);
        void ModesNotice.update();
      },
    },
    {
      id: "setResultSavingOn",
      display: "on",
      alias: "enabled incognito",
      exec: (): void => {
        TestState.setSaving(true);
        void ModesNotice.update();
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "setResultSaving",
    display: "Result saving...",
    icon: "fa-save",
    alias: "results",
    subgroup,
  },
];

export default commands;
