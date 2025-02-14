import * as UpdateConfig from "../../config";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "changeDeleteOnError",
    display: "Delete on error...",
    icon: "fa-hand-paper",
    subgroup: {
      title: "Delete on error...",
      configKey: "deleteOnError",
      list: [
        {
          id: "changeDeleteOnErrorOff",
          display: "off",
          configValue: "off",
          exec: (): void => {
            UpdateConfig.setDeleteOnError("off");
          },
        },
        {
          id: "changeDeleteOnErrorLetter",
          display: "letter",
          configValue: "letter",
          exec: (): void => {
            UpdateConfig.setDeleteOnError("letter");
          },
        },
        {
          id: "changeDeleteOnErrorWord",
          display: "word",
          configValue: "word",
          exec: (): void => {
            UpdateConfig.setDeleteOnError("word");
          },
        },
      ],
    },
  },
];

export default commands;
