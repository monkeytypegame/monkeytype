import { createSignal } from "solid-js";

import { showModal } from "./modals";

export type EditPresetData = {
  presetId: string;
  name: string;
};

const [editPresetData, setEditPresetData] = createSignal<EditPresetData | null>(
  null,
);

export { editPresetData };

export function showEditPresetModal(data: EditPresetData): void {
  setEditPresetData(data);
  showModal("EditPresetModal");
}
