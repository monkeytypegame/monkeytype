import { Result } from "@monkeytype/schemas/results";
import { Mode } from "@monkeytype/schemas/shared";
import { createSignal } from "solid-js";
import { showModal } from "./modals";
import { showErrorNotification } from "./notifications";

type IdAndTags = Pick<Result<Mode>, "_id" | "tags"> & { source?: "resultPage" };
const [getSelectedResult, setSelectedResult] = createSignal<IdAndTags | null>(
  null,
);

export { getSelectedResult };

export function showEditResultTagsModal(options: IdAndTags): void {
  if (options._id === "") {
    showErrorNotification(
      "Failed to show edit result tags modal: result id is empty",
    );
    return;
  }
  setSelectedResult(options);
  showModal("EditResultTags");
}
