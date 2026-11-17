import { TagNameSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import { insertTag } from "../../queries/tags";
import { showSimpleModal } from "../../states/simple-modal";
import { normalizeName } from "../../utils/strings";

export function showAddTagModal(): void {
  showSimpleModal({
    title: "Add new tag",
    buttonText: "add",
    schema: z.object({
      tagName: TagNameSchema,
    }),
    inputs: {
      tagName: {
        type: "text",
        placeholder: "tag name",
        preprocess: normalizeName,
      },
    },
    execFn: async ({ tagName }) => {
      const { error } = await insertTag(tagName);
      if (error !== null) {
        return {
          status: "error",
          message: "Failed to add tag",
          notificationOptions: { error },
        };
      }

      return {
        status: "success",
        message: "Tag added",
      };
    },
  });
}
