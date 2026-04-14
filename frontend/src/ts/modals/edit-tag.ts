import * as DB from "../db";
import * as Settings from "../pages/settings";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { SimpleModal, TextInput } from "../elements/simple-modal";
import { TagNameSchema } from "@monkeytype/schemas/users";
import { IsValidResponse } from "../types/validation";
import {
  insertTag,
  deleteTag,
  updateTagName,
  clearTagPBs,
} from "../collections/tags";
import { normalizeName } from "../utils/strings";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const tagNameValidation = async (tagName: string): Promise<IsValidResponse> => {
  const validationResult = TagNameSchema.safeParse(normalizeName(tagName));
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
        validation: { isValid: tagNameValidation, debounceDelay: 0 },
      },
    ],
    buttonText: "add",
    execFn: async (_thisPopup, propTagName) => {
      const tagName = TagNameSchema.parse(normalizeName(propTagName));

      try {
        //todo: do we await? if we do, optimistic updates are kinda pointless?
        await insertTag({ name: tagName });
      } catch (e) {
        return {
          status: "error",
          message: "Failed to add tag: " + errorMessage(e),
        };
      }

      void Settings.update();
      return { status: "success", message: `Tag added` };
    },
  }),
  edit: new SimpleModal({
    id: "editTag",
    title: "Edit tag",
    inputs: [
      {
        placeholder: "tag name",
        type: "text",
        validation: { isValid: tagNameValidation, debounceDelay: 0 },
      },
    ],
    buttonText: "save",
    beforeInitFn: (_thisPopup) => {
      (_thisPopup.inputs[0] as TextInput).initVal = _thisPopup.parameters[0];
    },
    execFn: async (_thisPopup, propTagName) => {
      const tagName = TagNameSchema.parse(normalizeName(propTagName));
      const tagId = _thisPopup.parameters[1] as string;

      try {
        await updateTagName({ tagId, newName: tagName });
      } catch (e) {
        return {
          status: "error",
          message: "Failed to update tag: " + errorMessage(e),
        };
      }

      void Settings.update();

      return { status: "success", message: `Tag updated` };
    },
  }),
  remove: new SimpleModal({
    id: "removeTag",
    title: "Delete tag",
    buttonText: "delete",
    beforeInitFn: (_thisPopup) => {
      _thisPopup.text = `Are you sure you want to delete tag ${_thisPopup.parameters[0]} ?`;
    },
    execFn: async (_thisPopup) => {
      const tagId = _thisPopup.parameters[1] as string;

      try {
        await deleteTag({ tagId });
      } catch (e) {
        return {
          status: "error",
          message: "Failed to remove tag: " + errorMessage(e),
        };
      }

      DB.removeTagFromResults(tagId);
      void Settings.update();

      return { status: "success", message: `Tag removed` };
    },
  }),
  clearPb: new SimpleModal({
    id: "clearTagPb",
    title: "Clear personal bests",
    buttonText: "clear",
    beforeInitFn: (_thisPopup) => {
      _thisPopup.text = `Are you sure you want to clear personal bests for tag ${_thisPopup.parameters[0]} ?`;
    },
    execFn: async (_thisPopup) => {
      const tagId = _thisPopup.parameters[1] as string;

      try {
        await clearTagPBs({ tagId });
      } catch (e) {
        return {
          status: "error",
          message: "Failed to clear tag PBs: " + errorMessage(e),
        };
      }

      void Settings.update();
      return { status: "success", message: `Tag PB cleared` };
    },
  }),
};

export function show(
  action: Action,
  id?: string,
  name?: string,
  modalChain?: AnimatedModal,
): void {
  const options: ShowOptions = {
    modalChain,
    focusFirstInput: "focusAndSelect",
  };
  if (action !== "add" && (name === undefined || id === undefined)) return;

  actionModals[action].show([name ?? "", id ?? ""], options);
}
