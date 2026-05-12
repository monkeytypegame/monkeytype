import { insertTag } from "../../collections/tags";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { showSimpleModal } from "../../states/simple-modal";

export function showAddTagModal(): void {
  showSimpleModal({
    title: "Add new tag",
    buttonText: "add",
    inputs: [
      {
        type: "text",
        placeholder: "tag name",
      },
    ],
    execFn: async (name) => {
      showLoaderBar();
      await insertTag({
        name,
      });
      hideLoaderBar();
      return {
        status: "success",
        message: "Tag added",
      };
    },
  });
}
