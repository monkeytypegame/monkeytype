import { TagNameSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import { insertTag } from "../../collections/tags";
import { showSimplerModal } from "../../states/simpler-modal";
import { normalizeName } from "../../utils/strings";

export function showAddTagModal(): void {
  showSimplerModal({
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
