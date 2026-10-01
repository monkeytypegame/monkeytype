import { TagNameSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import { insertTag } from "../../collections/tags";
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
      await insertTag({
        name: tagName,
      });

      return {
        status: "success",
        message: "Tag added",
      };
    },
  });
}
