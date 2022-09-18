import * as DB from "../../db";
import * as EditTagsPopup from "../../popups/edit-tags-popup";
import * as ModesNotice from "../../elements/modes-notice";
import * as TagController from "../../controllers/tag-controller";
import Config from "../../config";
import * as PaceCaret from "../../test/pace-caret";
import { Auth } from "../../firebase";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Change tags...",
  list: [],
};

const commands: MonkeyTypes.Command[] = [
  {
    visible: false,
    id: "changeTags",
    display: "Tags...",
    icon: "fa-tag",
    subgroup,
    beforeSubgroup: (): void => {
      update();
    },
    available: (): boolean => {
      return !!Auth.currentUser;
    },
  },
];

function update(): void {
  const snapshot = DB.getSnapshot();
  subgroup.list = [];
  if (!snapshot || !snapshot.tags || snapshot.tags.length === 0) {
    subgroup.list.push({
      id: "createTag",
      display: "Create tag",
      icon: "fa-plus",
      shouldFocusTestUI: false,
      exec: (): void => {
        EditTagsPopup.show("add");
      },
    });
    return;
  }
  subgroup.list.push({
    id: "clearTags",
    display: `Clear tags`,
    icon: "fa-times",
    exec: (): void => {
      const snapshot = DB.getSnapshot();

      snapshot.tags = snapshot.tags?.map((tag) => {
        tag.active = false;

        return tag;
      });

      DB.setSnapshot(snapshot);
      ModesNotice.update();
      TagController.saveActiveToLocalStorage();
    },
  });

  DB.getSnapshot().tags?.forEach((tag) => {
    let dis = tag.display;

    if (tag.active === true) {
      dis = '<i class="fas fa-fw fa-check"></i>' + dis;
    } else {
      dis = '<i class="fas fa-fw"></i>' + dis;
    }

    subgroup.list.push({
      id: "toggleTag" + tag._id,
      noIcon: true,
      display: dis,
      sticky: true,
      exec: (): void => {
        TagController.toggle(tag._id);
        ModesNotice.update();

        if (Config.paceCaret === "average") {
          PaceCaret.init();
          ModesNotice.update();
        }

        let txt = tag.display;

        if (tag.active === true) {
          txt = '<i class="fas fa-fw fa-check"></i>' + txt;
        } else {
          txt = '<i class="fas fa-fw"></i>' + txt;
        }
        if ($("#commandLine").hasClass("allCommands")) {
          $(
            `#commandLine .suggestions .entry[command='toggleTag${tag._id}']`
          ).html(
            `<div class="icon"><i class="fas fa-fw fa-tag"></i></div><div>Tags  > ` +
              txt
          );
        } else {
          $(
            `#commandLine .suggestions .entry[command='toggleTag${tag._id}']`
          ).html(txt);
        }
      },
    });
  });
  subgroup.list.push({
    id: "createTag",
    display: "Create tag",
    icon: "fa-plus",
    shouldFocusTestUI: false,
    exec: (): void => {
      EditTagsPopup.show("add");
    },
  });
}

export default commands;
export { update };
