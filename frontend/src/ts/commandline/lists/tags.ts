import * as DB from "../../db.js";
import * as EditTagsPopup from "../../modals/edit-tag.js";
import * as ModesNotice from "../../elements/modes-notice.js";
import * as TagController from "../../controllers/tag-controller.js";
import Config from "../../config.js";
import * as PaceCaret from "../../test/pace-caret.js";
import { isAuthenticated } from "../../firebase.js";
import AnimatedModal from "../../utils/animated-modal.js";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change tags...",
  list: [],
  beforeList: (): void => {
    update();
  },
};

const commands: MonkeyTypes.Command[] = [
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
  const snapshot = DB.getSnapshot();
  subgroup.list = [];
  if (
    snapshot === undefined ||
    snapshot.tags === undefined ||
    snapshot.tags.length === 0
  ) {
    subgroup.list.push({
      id: "createTag",
      display: "Create tag",
      icon: "fa-plus",
      shouldFocusTestUI: false,
      exec: ({ commandlineModal }): void => {
        EditTagsPopup.show(
          "add",
          undefined,
          undefined,
          commandlineModal as AnimatedModal
        );
      },
    });
    return;
  }
  subgroup.list.push({
    id: "clearTags",
    display: `Clear tags`,
    icon: "fa-times",
    sticky: true,
    exec: (): void => {
      const snapshot = DB.getSnapshot();
      if (!snapshot) return;

      snapshot.tags = snapshot.tags?.map((tag) => {
        tag.active = false;

        return tag;
      });

      DB.setSnapshot(snapshot);
      void ModesNotice.update();
      TagController.saveActiveToLocalStorage();
    },
  });

  for (const tag of snapshot.tags) {
    subgroup.list.push({
      id: "toggleTag" + tag._id,
      display: tag.display,
      sticky: true,
      active: () => {
        return (
          DB.getSnapshot()?.tags?.find((t) => t._id === tag._id)?.active ??
          false
        );
      },
      exec: async (): Promise<void> => {
        TagController.toggle(tag._id);
        void ModesNotice.update();

        if (Config.paceCaret === "average") {
          await PaceCaret.init();
          void ModesNotice.update();
        }
      },
    });
  }
  subgroup.list.push({
    id: "createTag",
    display: "Create tag",
    icon: "fa-plus",
    shouldFocusTestUI: false,
    opensModal: true,
    exec: ({ commandlineModal }): void => {
      EditTagsPopup.show(
        "add",
        undefined,
        undefined,
        commandlineModal as AnimatedModal
      );
    },
  });
}

export default commands;
