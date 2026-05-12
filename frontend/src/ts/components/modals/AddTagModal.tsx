import { TagNameSchema } from "@monkeytype/schemas/users";

import { insertTag } from "../../collections/tags";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { showSimpleModal } from "../../states/simple-modal";
import { normalizeName } from "../../utils/strings";

export function showAddTagModal(): void {
  showSimpleModal({
    title: "Add new tag",
    buttonText: "add",
    inputs: [
      {
        type: "text",
        placeholder: "tag name",
        validation: {
          isValid: async (tagName) => {
            const validationResult = TagNameSchema.safeParse(
              normalizeName(tagName),
            );
            if (validationResult.success) return true;
            return validationResult.error.errors
              .map((err) => err.message)
              .join(", ");
          },
        },
      },
    ],
    execFn: async (name) => {
      showLoaderBar();
      await insertTag({
        name: normalizeName(name),
      });
      hideLoaderBar();
      return {
        status: "success",
        message: "Tag added",
      };
    },
  });
}
