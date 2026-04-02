import * as EditTagsPopup from "../../modals/edit-tag";
import * as ModesNotice from "../../elements/modes-notice";
import {
  getTags,
  getTag,
  clearActiveTags,
  toggleTagActive,
} from "../../features/tags";
import { Config } from "../../config/store";
import * as PaceCaret from "../../test/pace-caret";
import { isAuthenticated } from "../../states/core";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Tags...",
  list: [],
  beforeList: (): void => {
    update();
  },
};

const commands: Command[] = [
  {
    id: "changeTags",
    display: "Tags...",
    icon: "fa-tag",
    subgroup,
    available: (): boolean => {
      return isAuthenticated();
    },
  },
];

function update(): void {
  const tags = getTags();
  subgroup.list = [];

  if (tags.length > 0) {
    subgroup.list.push({
      id: "clearTags",
      display: `Clear tags`,
      icon: "fa-times",
      sticky: true,
      exec: async (): Promise<void> => {
        clearActiveTags();
        if (
          Config.paceCaret === "average" ||
          Config.paceCaret === "tagPb" ||
          Config.paceCaret === "daily"
        ) {
          await PaceCaret.init();
        }
        void ModesNotice.update();
      },
    });

    for (const tag of tags) {
      subgroup.list.push({
        id: "toggleTag" + tag._id,
        display: tag.display,
        sticky: true,
        active: () => {
          return getTag(tag._id)?.active ?? false;
        },
        exec: async (): Promise<void> => {
          toggleTagActive(tag._id);

          if (
            Config.paceCaret === "average" ||
            Config.paceCaret === "tagPb" ||
            Config.paceCaret === "daily"
          ) {
            await PaceCaret.init();
          }
          void ModesNotice.update();
        },
      });
    }
  }
  subgroup.list.push({
    id: "createTag",
    display: "Create tag",
    icon: "fa-plus",
    shouldFocusTestUI: false,
    opensModal: true,
    exec: ({ commandlineModal }): void => {
      EditTagsPopup.show("add", undefined, undefined, commandlineModal);
    },
  });
}

export default commands;
