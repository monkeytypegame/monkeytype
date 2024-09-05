import Ape from "../ape";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as ConnectionState from "../states/connection";
import AnimatedModal from "../utils/animated-modal";

export function show(
  action: string,
  id?: string,
  name?: string,
  modalChain?: AnimatedModal
): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  void modal.show({
    focusFirstInput: true,
    modalChain,
    beforeAnimation: async () => {
      $("#editTagModal .modal .text").addClass("hidden");
      if (action === "add") {
        $("#editTagModal .modal").attr("data-action", "add");
        $("#editTagModal .modal .title").html("Add new tag");
        $("#editTagModal .modal button").html(`add`);
        $("#editTagModal .modal input").val("");
        $("#editTagModal .modal input").removeClass("hidden");
      } else if (action === "edit" && id !== undefined && name !== undefined) {
        $("#editTagModal .modal").attr("data-action", "edit");
        $("#editTagModal .modal").attr("data-tag-id", id);
        $("#editTagModal .modal .title").html("Edit tag");
        $("#editTagModal .modal button").html(`save`);
        $("#editTagModal .modal input").val(name);
        $("#editTagModal .modal input").removeClass("hidden");
      } else if (
        action === "remove" &&
        id !== undefined &&
        name !== undefined
      ) {
        $("#editTagModal .modal").attr("data-action", "remove");
        $("#editTagModal .modal").attr("data-tag-id", id);
        $("#editTagModal .modal .title").html("Delete tag");
        $("#editTagModal .modal .text").removeClass("hidden");
        $("#editTagModal .modal .text").html(
          `Are you sure you want to delete tag ${name}?`
        );
        $("#editTagModal .modal button").html(`delete`);
        $("#editTagModal .modal input").addClass("hidden");
      } else if (
        action === "clearPb" &&
        id !== undefined &&
        name !== undefined
      ) {
        $("#editTagModal .modal").attr("data-action", "clearPb");
        $("#editTagModal .modal").attr("data-tag-id", id);
        $("#editTagModal .modal .title").html("Clear personal bests");
        $("#editTagModal .modal .text").removeClass("hidden");
        $("#editTagModal .modal .text").html(
          `Are you sure you want to clear personal bests for tag ${name}?`
        );
        $("#editTagModal .modal button").html(`clear`);
        $("#editTagModal .modal input").addClass("hidden");
      }
    },
  });
}

function hide(clearModalChain = false): void {
  void modal.hide({
    clearModalChain,
  });
}

async function apply(): Promise<void> {
  const action = $("#editTagModal .modal").attr("data-action");
  const propTagName = $("#editTagModal .modal input").val() as string;
  const tagName = propTagName.replaceAll(" ", "_");
  const tagId = $("#editTagModal .modal").attr("data-tag-id") as string;

  hide(true);
  Loader.show();

  if (action === "add") {
    const response = await Ape.users.createTag({ body: { tagName } });

    if (response.status !== 200) {
      Notifications.add(
        "Failed to add tag: " +
          response.body.message.replace(tagName, propTagName),
        -1
      );
    } else {
      if (response.body.data === null) {
        Notifications.add("Tag was added but data returned was null", -1);
        Loader.hide();
        return;
      }

      Notifications.add("Tag added", 1);
      DB.getSnapshot()?.tags?.push({
        display: propTagName,
        name: response.body.data.name,
        _id: response.body.data._id,
        personalBests: {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        },
      });
      void Settings.update();
    }
  } else if (action === "edit") {
    const response = await Ape.users.editTag({
      body: { tagId, newName: tagName },
    });

    if (response.status !== 200) {
      Notifications.add("Failed to edit tag: " + response.body.message, -1);
    } else {
      Notifications.add("Tag updated", 1);
      DB.getSnapshot()?.tags?.forEach((tag) => {
        if (tag._id === tagId) {
          tag.name = tagName;
          tag.display = propTagName;
        }
      });
      void Settings.update();
    }
  } else if (action === "remove") {
    const response = await Ape.users.deleteTag({ params: { tagId } });

    if (response.status !== 200) {
      Notifications.add("Failed to remove tag: " + response.body.message, -1);
    } else {
      Notifications.add("Tag removed", 1);
      DB.getSnapshot()?.tags?.forEach((tag, index: number) => {
        if (tag._id === tagId) {
          DB.getSnapshot()?.tags?.splice(index, 1);
        }
      });
      void Settings.update();
    }
  } else if (action === "clearPb") {
    const response = await Ape.users.deleteTagPersonalBest({
      params: { tagId },
    });

    if (response.status !== 200) {
      Notifications.add("Failed to clear tag pb: " + response.body.message, -1);
    } else {
      Notifications.add("Tag PB cleared", 1);
      DB.getSnapshot()?.tags?.forEach((tag) => {
        if (tag._id === tagId) {
          tag.personalBests = {
            time: {},
            words: {},
            quote: {},
            zen: {},
            custom: {},
          };
        }
      });
      void Settings.update();
    }
  }
  Loader.hide();
}

const modal = new AnimatedModal({
  dialogId: "editTagModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.addEventListener("submit", (e) => {
      e.preventDefault();
      void apply();
    });
  },
});
