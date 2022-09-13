import * as DB from "../../db";
import * as EditTagsPopup from "../../popups/edit-tags-popup";
import * as ModesNotice from "../../elements/modes-notice";
import * as TagController from "../../controllers/tag-controller";
import Config from "../../config";
import * as PaceCaret from "../../test/pace-caret";

const commands: MonkeyTypes.CommandsGroup = {
  title: "Change tags...",
  list: [],
};

function update(): void {
  const snapshot = DB.getSnapshot();
  commands.list = [];
  if (!snapshot || !snapshot.tags || snapshot.tags.length === 0) {
    commands.list.push({
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
  commands.list.push({
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

    commands.list.push({
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
  commands.list.push({
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
