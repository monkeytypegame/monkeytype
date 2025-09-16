import { buildCommandForConfigKey } from "../util";
import { KeymapCustom } from "@monkeytype/schemas/configs";
import { stringToKeymap } from "../../utils/custom-keymap";
import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { Command } from "../types";

const fromMeta = buildCommandForConfigKey("keymapStyle");

if (fromMeta.subgroup) {
  const indexCustom = fromMeta.subgroup.list.findIndex(
    (command) => command.id === "setKeymapStyleCustom"
  );
  fromMeta.subgroup.list.splice(indexCustom, 1, {
    id: "setKeymapStyleCustom",
    display: "custom...",
    configValue: "custom",
    icon: "fa-keyboard",
    subgroup: {
      title: "Set custom keymap?",
      list: [
        {
          id: "setKeymapStyleCustomNew",
          display: "new keymap",
          input: true,
          exec: ({ input }) => {
            if (input === undefined || input === "") return;
            const keymap: KeymapCustom = stringToKeymap(input);
            UpdateConfig.setKeymapCustom(keymap);
            UpdateConfig.setKeymapStyle("custom");
            TestLogic.restart();
          },
        },
        {
          id: "setKeymapStyleCustomLoad",
          display: "load keymap",
          exec: () => {
            UpdateConfig.setKeymapStyle("custom");
          },
        },
      ],
    },
  });
}

const commands: Command[] = [fromMeta];

export default commands;
