import Ape from "../ape";
import * as DB from "../db";
import * as Settings from "../pages/settings";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { SimpleModal, TextInput } from "../utils/simple-modal";
import { TagNameSchema } from "@monkeytype/contracts/schemas/users";

const cleanTagName = (tagName: string): string => tagName.replaceAll(" ", "_");
const tagNameValidation = async (tagName: string): Promise<true | string> => {
  const validationResult = TagNameSchema.safeParse(cleanTagName(tagName));
  if (validationResult.success) return true;
  return validationResult.error.errors.map((err) => err.message).join(", ");
};

type Action = "add" | "edit" | "remove" | "clearPb";
const actionModals: Record<Action, SimpleModal> = {
  add: new SimpleModal({
    id: "addTag",
    title: "Add new tag",
    inputs: [
      {
        placeholder: "tag name",
        type: "text",
        validation: { isValid: tagNameValidation },
      },
    ],
    onlineOnly: true,
    buttonText: "add",
    execFn: async (_thisPopup, propTagName) => {
      const tagName = cleanTagName(propTagName);
      const response = await Ape.users.createTag({ body: { tagName } });

      if (response.status !== 200) {
        return {
          status: -1,
          message:
            "Failed to add tag: " +
            response.body.message.replace(tagName, propTagName),
        };
      }

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

      return { status: 1, message: `Tag added` };
    },
  }),
  edit: new SimpleModal({
    id: "editTag",
    title: "Edit tag",
    inputs: [
      {
        placeholder: "tag name",
        type: "text",
        validation: { isValid: tagNameValidation },
      },
    ],
    onlineOnly: true,
    buttonText: "save",
    beforeInitFn: (_thisPopup) => {
      (_thisPopup.inputs[0] as TextInput).initVal = _thisPopup.parameters[0];
    },
    execFn: async (_thisPopup, propTagName) => {
      const tagName = cleanTagName(propTagName);
      const tagId = _thisPopup.parameters[1] as string;

      const response = await Ape.users.editTag({
        body: { tagId, newName: tagName },
      });

      if (response.status !== 200) {
        return {
          status: -1,
          message: "Failed to edit tag: " + response.body.message,
        };
      }

      DB.getSnapshot()?.tags?.forEach((tag) => {
        if (tag._id === tagId) {
          tag.name = tagName;
          tag.display = propTagName;
        }
      });
      void Settings.update();

      return { status: 1, message: `Tag updated` };
    },
  }),
  remove: new SimpleModal({
    id: "removeTag",
    title: "Delete tag",
    onlineOnly: true,
    buttonText: "delete",
    beforeInitFn: (_thisPopup) => {
      _thisPopup.text = `Are you sure you want to delete tag ${_thisPopup.parameters[0]} ?`;
    },
    execFn: async (_thisPopup) => {
      const tagId = _thisPopup.parameters[1] as string;
      const response = await Ape.users.deleteTag({ params: { tagId } });

      if (response.status !== 200) {
        return {
          status: -1,
          message: "Failed to remove tag: " + response.body.message,
        };
      }

      DB.getSnapshot()?.tags?.forEach((tag, index: number) => {
        if (tag._id === tagId) {
          DB.getSnapshot()?.tags?.splice(index, 1);
        }
      });
      void Settings.update();
      return { status: 1, message: `Tag removed` };
    },
  }),
  clearPb: new SimpleModal({
    id: "clearTagPb",
    title: "Clear personal bests",
    onlineOnly: true,
    buttonText: "clear",
    beforeInitFn: (_thisPopup) => {
      _thisPopup.text = `Are you sure you want to clear personal bests for tag ${_thisPopup.parameters[0]} ?`;
    },
    execFn: async (_thisPopup) => {
      const tagId = _thisPopup.parameters[1] as string;
      const response = await Ape.users.deleteTagPersonalBest({
        params: { tagId },
      });

      if (response.status !== 200) {
        return {
          status: -1,
          message: "Failed to clear tag pb: " + response.body.message,
        };
      }

      void Settings.update();
      return { status: 1, message: `Tag PB cleared` };
    },
  }),
};

export function show(
  action: Action,
  id?: string,
  name?: string,
  modalChain?: AnimatedModal
): void {
  const options: ShowOptions = {
    modalChain,
    focusFirstInput: "focusAndSelect",
  };
  if (action !== "add" && (name === undefined || id === undefined)) return;

  actionModals[action].show([name ?? "", id ?? ""], options);
}
