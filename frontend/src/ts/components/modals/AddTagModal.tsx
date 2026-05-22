import { TagNameSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import { insertTag } from "../../collections/tags";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { showSimplerModal } from "../../states/simpler-modal";
import { normalizeName } from "../../utils/strings";

export function showAddTagModal(): void {
  showSimplerModal({
    title: "Add new tag",
    buttonText: "add",
    schema: z.object({
      tagName: TagNameSchema,
      age: z.number().min(13).max(99),
      checked: z.boolean(),
      date: z.date().min(new Date()).max(new Date()),
    }),
    inputs: {
      tagName: {
        type: "text",
        placeholder: "tag name",
        preprocess: normalizeName,
      },
      age: {
        initVal: 16,
        type: "number",
        placeholder: "age",
      },
      checked: {
        initVal: true,
        type: "checkbox",
        label: "sure?",
      },
      date: {
        type: "date",
        label: "day",
        initVal: new Date(),
      },
    },
    execFn: async ({ tagName }) => {
      showLoaderBar();
      await insertTag({
        name: tagName,
      });
      hideLoaderBar();
      return {
        status: "success",
        message: "Tag added",
      };
    },
  });
}
