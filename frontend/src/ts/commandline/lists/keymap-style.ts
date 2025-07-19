import { KeymapCustom } from "@monkeytype/contracts/schemas/configs";
import * as UpdateConfig from "../../config";
import { Command, CommandsSubgroup } from "../types";
import { stringToKeymap } from "../../utils/custom-keymap";
import * as TestLogic from "../../test/test-logic";

const subgroup: CommandsSubgroup = {
  title: "Keymap style...",
  configKey: "keymapStyle",
  list: [
    {
      id: "setKeymapStyleStaggered",
      display: "staggered",
      configValue: "staggered",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("staggered");
      },
    },
    {
      id: "setKeymapStyleAlice",
      display: "alice",
      configValue: "alice",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("alice");
      },
    },
    {
      id: "setKeymapStyleMatrix",
      display: "matrix",
      configValue: "matrix",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("matrix");
      },
    },
    {
      id: "setKeymapStyleSplit",
      display: "split",
      configValue: "split",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("split");
      },
    },
    {
      id: "setKeymapStyleSplitMatrix",
      display: "split matrix",
      configValue: "split_matrix",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("split_matrix");
      },
    },
    {
      id: "setKeymapStyleSteno",
      display: "steno",
      configValue: "steno",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("steno");
      },
    },
    {
      id: "setKeymapStyleStenoMatrix",
      display: "steno matrix",
      configValue: "steno_matrix",
      exec: (): void => {
        UpdateConfig.setKeymapStyle("steno_matrix");
      },
    },
    {
      id: "setKeymapStyleCustom",
      display: "custom...",
      configValue: "custom",
      icon: "fa-keyboard",
      subgroup: {
        title: "Set custom keymap?",
        configKey: "keymapCustom",
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
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeKeymapStyle",
    display: "Keymap style...",
    alias: "keyboard",
    icon: "fa-keyboard",
    subgroup,
  },
];

export default commands;
