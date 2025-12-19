import * as TestState from "../../test/test-state";
import * as ModesNotice from "../../elements/modes-notice";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
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

const commands: Command[] = [
  {
    id: "setResultSaving",
    display: "Result saving...",
    icon: "fa-save",
    alias: "results",
    subgroup,
  },
];

export default commands;
